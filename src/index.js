const path = require('path')
const resolveFrom = require('resolve-from')
const stylelint = require('stylelint')
const toPassStylelint = require('./toPassStylelint')
const findComponent = require('./findComponent')
const createFormatter = require('./createFormatter')
const wrapFormatter = require('./wrapFormatter')

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
function runLint(styles, lintOptions, stripIndent, formatterOptions) {
  return Promise.all(
    styles.map(([selector, css]) => {
      const component = findComponent(selector)

      if (stripIndent) {
        // Strip indentation based on the number of spaces at the start of the
        // last line (which should precede the backtick).
        const trailingIndent = css.match(/([\r\n])( *)[)}'";]*$/)
        if (trailingIndent) {
          const baseIndent = trailingIndent[2]
          if (baseIndent) {
            const repeat = selector ? 1 : 2
            const pattern = new RegExp(`^${baseIndent.repeat(repeat)}`, 'gm')
            css = css.replace(pattern, '')
          }
        }
      }

      // If we need to modify the code at all to prepare it for stylelint, we
      // may need to modify lines/columns or suppress certain warnings.
      let code = css
      let filterWarning

      // Prepare input for stylelint.
      const transformResult = preprocess(selector, code)
      if (Array.isArray(transformResult)) {
        code = transformResult[0]
        filterWarning = transformResult[1]
      } else {
        code = transformResult
      }

      const options = Object.assign({ code }, lintOptions)

      // Wrap or create formatter.
      if (typeof options.formatter === 'string') {
        const formatter = stylelint.formatters[options.formatter]
        if (formatter) {
          options.formatter = wrapFormatter(formatter, filterWarning)
        }
      } else if (options.formatter) {
        options.formatter = wrapFormatter(options.formatter, filterWarning)
      } else {
        const formatter = createFormatter(
          selector,
          css,
          component,
          formatterOptions
        )
        options.formatter = wrapFormatter(formatter, filterWarning)
      }

      return stylelint.lint(options).then(result => {
        return {
          selector,
          css,
          component,
          options,
          result
        }
      })
    })
  )
}

/**
 * Prepare input CSS for stylelint. If `selector` is empty, this does nothing.
 * But if there is a selector, we need to wrap `css` with it. Otherwise,
 * stylelint doesn't consider it a proper block of rules, and you'll miss some
 * warnings (like `property-no-unknown`).
 *
 * Since we modify the user's CSS, this also returns a function that will be
 * used to modify or suppress warnings, so they don't get confusing results.
 */
function preprocess(selector, css) {
  if (!css || !selector) {
    return css
  }
  const lines = css.split(/(?:\r\n|\r|\n)/)
  return [
    `${selector} {${css}}`,
    warning => {
      const columnsAdded = selector.length + 2
      if (warning.line === 1) {
        // If any issues come from the selector we added, filter them out.
        if (warning.column <= columnsAdded) {
          return false
        }
        if (
          warning.rule === 'block-opening-brace-space-after' &&
          warning.column === columnsAdded + 1
        ) {
          return false
        }
        // Otherwise, fix the column number to account for the selector.
        warning.column -= columnsAdded
      }
      if (warning.line === lines.length) {
        if (
          warning.rule === 'block-closing-brace-space-before' &&
          warning.column === lines[lines.length - 1].length
        ) {
          return false
        }
      }
    }
  ]
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
  const formatterOptions = options.formatterOptions

  // Any options besides those above will be passed to `stylelint.lint()`.
  const lintOptions = Object.assign(
    {
      syntax: 'scss',
      // We don't know how to get the actual component file yet. But we can use
      // `findComponent` to possibly get information about its name, className,
      // ID, etc. Replace this string in the matcher.
      codeFilename: `__COMPONENT_PATH__`
    },
    options
  )

  delete lintOptions.failOnError
  delete lintOptions.stripIndent
  delete lintOptions.formatterOptions

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
      const lintResults = runLint(
        styles,
        lintOptions,
        stripIndent,
        formatterOptions
      )
      lintResults.catch(err => {
        console.log(err.stack)
      })
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
