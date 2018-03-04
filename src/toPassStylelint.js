const path = require('path')

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

function toPassStylelint(lintResults, failOnError) {
  const { testPath } = this
  const relativePath = path.relative(process.cwd(), testPath)
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
        .map(({ result, options }) => {
          if (options.formatter === 'string') {
            // Remove excessive whitespace in the default `string` formatter.
            return result.output.replace(/(^\n|\n$)/g, '')
          }
          return result.output
        })
        .filter(output => output)
        .join('\n')

      return output.replace(/__TEST_PATH__/g, relativePath)
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
