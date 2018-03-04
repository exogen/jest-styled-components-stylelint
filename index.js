const path = require('path')
const resolveFrom = require('resolve-from')
const stylelint = require('stylelint')
const stripIndentFn = require('strip-indent')

// Get the instance of stylis that styled-components sees.
const styledDir = path.dirname(
  require.resolve('styled-components/package.json')
)
const stylisPath = resolveFrom(styledDir, 'stylis')
const Stylis = require(stylisPath)

function countErrors(lintResults) {
  return lintResults.reduce((count, result) => {
    if (result.errored) {
      return (
        count +
        result.results.reduce((count, ruleResult) => {
          return count + (ruleResult.errored ? 1 : 0)
        }, 0)
      )
    }
    return count
  }, 0)
}

function createAssertion(failOnError) {
  function toPassStylelint(lintResults, expected) {
    this.utils.ensureNoExpected(expected, 'toPassStylelint')
    const { testPath } = this
    const relativePath = path.relative(process.cwd(), testPath)
    const errorCount = countErrors(lintResults)
    const pass = errorCount === 0
    if (pass) {
      return {
        pass,
        message: () => `expected not to pass stylelint, but it found no errors`
      }
    } else {
      const message = () => {
        let output = `expected to pass stylelint, but it found `
        output += `${this.utils.pluralize('error', errorCount)}:\n`
        output += lintResults
          .map(result => result.output)
          .filter(output => output)
          .join('\n')
        output = output.replace(/__TEST_PATH__/, relativePath)
        // Remove excessive whitespace at the end of stylelint output.
        output = output.replace(/\n\n$/, '')
        return output
      }
      if (failOnError) {
        return { pass, message }
      } else {
        console.error(message())
        return { pass: true, message }
      }
    }
  }

  return toPassStylelint
}

function createMockStylis(styleCollector) {
  /**
   * When using `stylis` as a factory, always return an instance that will
   * collect styles via `styleCollector` when called, before passing through to
   * the real instance.
   */
  function mockStylis(...args) {
    if (this && this.constructor === mockStylis) {
      const stylis = new Stylis(...args)
      function stylisWrapper(selector, css) {
        styleCollector(selector, css)
        return stylis.apply(this, arguments)
      }
      stylisWrapper.use = stylis.use
      stylisWrapper.set = stylis.set
      return stylisWrapper
    }
    return Stylis.apply(this, args)
  }

  return mockStylis
}

// Flag to show a nice warning if imported but not configured.
let configured = false

function configure(options = {}) {
  configured = true

  const failOnError = options.failOnError !== false
  const stripIndent = options.stripIndent !== false

  // Any options besides those above will be passed to `stylelint.lint()`.
  const lintOptions = Object.assign({ formatter: 'string' }, options)
  delete lintOptions.failOnError
  delete lintOptions.stripIndent

  const collectedStyles = []
  const styleCollector = (selector, css) => {
    collectedStyles.push([selector, css])
  }

  function runLint(styles) {
    return Promise.all(
      styles.map(([selector, css]) => {
        const options = Object.assign({}, lintOptions, {
          code: stripIndent ? stripIndentFn(css) : css,
          // FIXME: There's probably no way we can get the actual component
          // source file using styled-components. Possibly just its ID or
          // `displayName` (by reading style tags and searching for metadata
          // around each selector). Improve this to do that at some point. For
          // now, show the selector and test file. `__TEST_PATH__` will be
          // replaced in the matcher.
          codeFilename: `${selector} rendered in __TEST_PATH__`
        })
        return stylelint.lint(options)
      })
    )
  }

  jest.doMock(stylisPath, () => createMockStylis(styleCollector))

  const toPassStylelint = createAssertion(failOnError)
  expect.extend({ toPassStylelint })

  beforeEach(() => {
    collectedStyles.length = 0
  })

  afterEach(() => {
    if (collectedStyles.length) {
      const styles = collectedStyles.slice()
      collectedStyles.length = 0
      return expect(runLint(styles)).resolves.toPassStylelint()
    }
  })
}

beforeAll(() => {
  if (!configured) {
    console.warn(
      `Looks like you imported jest-styled-components-stylelint but it hasn’t been configured. Did you forget to call configure()?`
    )
  }
})

module.exports = configure
