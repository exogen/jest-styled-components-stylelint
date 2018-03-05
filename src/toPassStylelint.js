const path = require('path')
const chalk = require('chalk')

/**
 * Count the number of warnings with 'error' severity.
 */
function countErrors(lintResults) {
  return lintResults.reduce((count, { result }) => {
    if (result.errored) {
      return (
        count +
        result.results.reduce((count, ruleResult) => {
          const errorWarnings = ruleResult.warnings.filter(
            warning => warning.severity === 'error'
          )
          return count + (ruleResult.errored ? errorWarnings.length || 1 : 0)
        }, 0)
      )
    }
    return count
  }, 0)
}

function formatComponentPath(testFile, selector, component) {
  const renderedIn = chalk.dim(' rendered in ')
  const withClassName = chalk.dim(' with className ')
  const andID = chalk.dim(' and ID ')
  if (component) {
    return `<${component.name}>${renderedIn}${testFile}${withClassName}${
      component.hash
    }${andID}${component.id}`
  } else if (selector) {
    const hash = selector.slice(1)
    return `Component${renderedIn}${testFile}${withClassName}${hash}`
  } else {
    return `Component${renderedIn}${testFile}`
  }
}

function toPassStylelint(lintResults, failOnError) {
  const { testPath } = this
  const testFile = path.basename(testPath)
  const errorCount = countErrors(lintResults)
  const pass = errorCount === 0
  if (pass) {
    return {
      pass,
      message: () => `Expected not to pass stylelint, but it found no errors`
    }
  } else {
    const message = () => {
      let output = `Expected to pass stylelint, but it found `
      output += `${this.utils.pluralize('error', errorCount)}:\n\n`
      output += lintResults
        .map(({ selector, component, result, options }) => {
          let output = result.output
          if (options.formatter === 'string') {
            // Remove excessive whitespace in the default `string` formatter.
            output = output.replace(/(^\n|\n$)/g, '')
          }
          const componentPath = formatComponentPath(
            testFile,
            selector,
            component
          )
          return output.replace(/__COMPONENT_PATH__/g, componentPath)
        })
        .filter(output => output)
        .join('\n')

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

module.exports = toPassStylelint
