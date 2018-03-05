const chalk = require('chalk')

function padLeft(value, width) {
  value = `${value}`
  return `${' '.repeat(Math.max(0, width - value.length))}${value}`
}

function createFormatter(
  selector,
  code,
  component,
  { collapseLines = true } = {}
) {
  const lines = code.split(/\r\n|\r|\n/)
  return results => {
    let output = ''
    results.forEach(result => {
      const warnings = result.warnings.slice().sort((a, b) => {
        if (a.line < b.line) {
          return -1
        } else if (a.line > b.line) {
          return 1
        } else {
          return a.column - b.column
        }
      })
      const lineMap = new Map()
      warnings.forEach(warning => {
        const lineWarnings = lineMap.get(warning.line) || []
        lineWarnings.push(warning)
        lineMap.set(warning.line, lineWarnings)
      })
      output += `${chalk.underline('__COMPONENT_PATH__')}\n`
      lineMap.forEach((warnings, lineNumber) => {
        const line = lines[lineNumber - 1]
        const numberWidth = `${lineNumber}`.length
        const left = `${padLeft(lineNumber, numberWidth)} | `
        if (collapseLines) {
          output += `\n${chalk.dim(left + line)}\n`
          const carets = new Array(line.length).fill(' ')
          warnings.forEach(warning => {
            carets[warning.column - 1] = chalk.red('^')
          })
          output += chalk.dim(padLeft('', numberWidth) + '   ')
          output += carets.join('') + '\n'
          warnings.forEach(warning => {
            output += chalk.red(padLeft('', numberWidth) + ' ✖ ')
            output += warning.text.replace(/ \([\w-]+\)$/, '')
            output += `${chalk.dim(` (${warning.rule})`)}\n`
          })
        } else {
          warnings.forEach(warning => {
            output += `\n${chalk.dim(left + line)}\n`
            output += chalk.dim(padLeft('', numberWidth) + '   ')
            output += ' '.repeat(warning.column - 1) + chalk.red('^') + '\n'
            output += chalk.red(padLeft('', numberWidth) + ' ✖ ')
            output += warning.text.replace(/ \([\w-]+\)$/, '')
            output += `${chalk.dim(` (${warning.rule})`)}\n`
          })
        }
      })
      // Remove final extra newline.
    })
    return output
  }
}

module.exports = createFormatter
