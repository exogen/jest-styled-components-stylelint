const path = require('path')
const resolveFrom = require('resolve-from')
const stylelintPlugin = require('stylis-plugin-stylelint')

// Get the instance of stylis that styled-components sees.
const styledDir = path.dirname(
  require.resolve('styled-components/package.json')
)
const stylisPath = resolveFrom(styledDir, 'stylis')
const Stylis = require(stylisPath)

function createMockStylis(options) {
  const pluginOptions = Object.assign(
    {
      failOnError: false,
      getLintOptions: meta => {
        return {
          // TODO: Do something fancy to get either the test filename or
          // better, the actual component file.
          codeFilename: meta.selectors[0]
        }
      }
    },
    options
  )

  /**
   * When using `stylis` as a factory, always return an instance with the
   * `stylelint` plugin already added.
   */
  function mockStylis(...args) {
    if (this && this.constructor === mockStylis) {
      const plugin = stylelintPlugin(pluginOptions)
      const stylis = new Stylis(...args)
      stylis.use(plugin)
      return stylis
    }
    return Stylis.apply(this, args)
  }

  return mockStylis
}

let configured = false

function configure(options) {
  configured = true
  jest.doMock(stylisPath, () => createMockStylis(options))
}

beforeAll(() => {
  if (!configured) {
    console.warn(
      `Looks like you imported jest-styled-components-stylelint but it hasn’t been configured. Did you forget to call configure()?`
    )
  }
})

module.exports = configure
