const path = require('path')
const resolveFrom = require('resolve-from')
const stylelintPlugin = require('stylis-plugin-stylelint')

// Get the instance of stylis that styled-components sees.
const styledDir = path.dirname(
  require.resolve('styled-components/package.json')
)
const stylisPath = resolveFrom(styledDir, 'stylis')
const Stylis = require(stylisPath)

const defaultOptions = {
  getLintOptions: meta => {
    return {
      // TODO: Do something fancy to get either the test filename or
      // better, the actual component file.
      codeFilename: meta.selectors[0]
    }
  }
}

function createAssertion(lintResults) {
  function toPassStylelint(resultsOrFunction) {
    if (typeof resultsOrFunction === 'function') {
      lintResults.length = 0
      resultsOrFunction()
      resultsOrFunction = lintResults.slice()
      // Reset here! Otherwise, it wouldn't be possible to use `failOnError` but
      // have some tests that `expect(fn).not.toPassStylelint()`.
      lintResults.length = 0
    }
    const errorCount = resultsOrFunction.reduce((count, result) => {
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
    const pass = errorCount === 0
    const message = pass
      ? () => `expected not to pass stylelint, but it found no errors`
      : () =>
          `expected to pass stylelint, but it found ${errorCount} error${
            errorCount === 1 ? '' : 's'
          }`
    return { pass, message }
  }

  return toPassStylelint
}

function createMockStylis(options = {}) {
  /**
   * When using `stylis` as a factory, always return an instance with the
   * `stylelint` plugin already added.
   */
  function mockStylis(...args) {
    if (this && this.constructor === mockStylis) {
      const plugin = stylelintPlugin(options)
      const stylis = new Stylis(...args)
      stylis.use(plugin)
      return stylis
    }
    return Stylis.apply(this, args)
  }

  return mockStylis
}

let configured = false

function configure(options = {}) {
  configured = true

  const { failOnError } = options
  const lintResults = []
  const pluginOptions = Object.assign({}, defaultOptions, options, {
    // Force this to be false, otherwise renderers will print an ugly error
    // message about adding error boundaries to components and such. If
    // `failOnError` is set, we'll check the results below and use `expect()` to
    // fail the test in a nicer way.
    failOnError: false,
    resultCollector: resultObject => lintResults.push(resultObject)
  })

  expect.extend({
    toPassStylelint: createAssertion(lintResults)
  })

  if (failOnError) {
    beforeEach(() => {
      lintResults.length = 0
    })

    afterEach(() => {
      expect(lintResults).toPassStylelint()
      lintResults.length = 0
    })
  }

  jest.doMock(stylisPath, () => createMockStylis(pluginOptions))
}

beforeAll(() => {
  if (!configured) {
    console.warn(
      `Looks like you imported jest-styled-components-stylelint but it hasn’t been configured. Did you forget to call configure()?`
    )
  }
})

module.exports = configure
