/**
 * Since we may need to munge the user's input CSS to prepare it for stylelint
 * (for example, by adding the selector surrounding the block of CSS), we should
 * fix line/column numbers or suppress certain warnings (so the added code
 * doesn't mess with the output).
 *
 * This function wraps any formatter to pre-filter the results.
 */
function wrapFormatter(formatter, filterWarning) {
  if (filterWarning) {
    return results => {
      results.forEach(result => {
        let errored = false
        result.warnings = result.warnings.filter(warning => {
          const keep = filterWarning(warning) !== false
          if (keep && warning.severity === 'error') {
            errored = true
          }
          return keep
        })
        result.errored = errored
      })
      return formatter(results)
    }
  }
  return formatter
}

module.exports = wrapFormatter
