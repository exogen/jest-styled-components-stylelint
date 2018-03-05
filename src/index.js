const path = require('path')
const resolveFrom = require('resolve-from')
const stylelint = require('stylelint')
const stripIndentFn = require('strip-indent')
const toPassStylelint = require('./toPassStylelint')
const findComponent = require('./findComponent')

/**
 * Get the path to the `stylis` module that `styled-components` sees.
 */
function getStylisPath() {
  const styledDir = path.dirname(
    require.resolve('styled-components/package.json')
  )
  return resolveFrom(styledDir, 'stylis')
}

/**
 * Create the mock function that `styled-components` will get instead of the
 * real one when it imports `stylis`. The function will collect any styles
 * passed to it by calling the provided `styleCollector` function.
 */
function createMockStylis(Stylis, styleCollector) {
  return function mockStylis(...args) {
    if (this && this.constructor === mockStylis) {
      const stylis = new Stylis(...args)
      const stylisWrapper = function(selector, css) {
        styleCollector(selector, css)
        return stylis.apply(this, arguments)
      }
      stylisWrapper.use = stylis.use
      stylisWrapper.set = stylis.set
      return stylisWrapper
    }
    styleCollector(...args)
    return Stylis.apply(this, args)
  }
}

/**
 * Run lint on multiple styles and return a Promise that will resolve to an
 * array of results for each, with the original `selector` and `css` included.
 */
function runLint(styles, lintOptions, preprocess) {
  return Promise.all(
    styles.map(([selector, css]) => {
      const component = findComponent(selector)
      const code = preprocess ? preprocess(css) : css
      const options = Object.assign({ code }, lintOptions)
      return stylelint.lint(options).then(result => ({
        selector,
        css,
        component,
        options,
        result
      }))
    })
  )
}

// Flag to show a nice warning if imported but not configured.
let configured = false

/*
 * Enable mocking, test hooks, etc.
 * Nothing happens if this isn't called (but a warning will be printed below).
 */
function configure(options = {}) {
  configured = true

  const failOnError = options.failOnError !== false
  const stripIndent = options.stripIndent !== false
  const preprocess = stripIndent ? stripIndentFn : undefined

  // Any options besides those above will be passed to `stylelint.lint()`.
  const lintOptions = Object.assign(
    {
      syntax: 'scss',
      formatter: 'string',
      // FIXME: There's probably no way we can get the actual component source
      // file using styled-components. Possibly just its ID or `displayName` (by
      // reading style tags and searching for metadata around each selector).
      // Improve this to do that at some point. For now, show the test file.
      // `__COMPONENT_PATH__` will be replaced in the matcher.
      codeFilename: `__COMPONENT_PATH__`
    },
    options
  )

  delete lintOptions.failOnError
  delete lintOptions.stripIndent

  const collectedStyles = []
  const styleCollector = (selector, css) => {
    collectedStyles.push([selector, css])
  }

  const stylisPath = getStylisPath()
  const Stylis = require(stylisPath)

  // Add mock!
  jest.doMock(stylisPath, () => createMockStylis(Stylis, styleCollector))

  // Add matcher!
  expect.extend({ toPassStylelint })

  // Add hooks!
  beforeEach(() => {
    collectedStyles.length = 0
  })
  afterEach(() => {
    if (collectedStyles.length) {
      // Get styles to lint and reset for the next test.
      const styles = collectedStyles.slice()
      collectedStyles.length = 0
      // stylelint is async, so use `expect().resolves` and return the result.
      const lintResults = runLint(styles, lintOptions, preprocess)
      return expect(lintResults).resolves.toPassStylelint(failOnError)
    }
  })
}

if (typeof beforeAll === 'function') {
  beforeAll(() => {
    if (!configured) {
      console.warn(
        `Looks like you imported jest-styled-components-stylelint but it hasn’t been configured. Did you forget to call configure()?`
      )
    }
  })
}

module.exports = configure
