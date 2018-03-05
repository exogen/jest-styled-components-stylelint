/**
 * Try to associate a generated selector from `styled-components` with a
 * component, otherwise we don't know anything about it.
 */
function findComponent(selector) {
  if (typeof document !== 'object' || !document.querySelectorAll) {
    return
  }
  const hash = selector.slice(1)
  const styleSelector = `style[data-styled-components~="${hash}"]`
  const styleTag = document.querySelectorAll(styleSelector)[0]
  if (styleTag) {
    const pattern = new RegExp(
      `\\/\\* sc-component-id: ((([^_]+)__)?([^-]+)[^ ]+) \\*\\/\\s\\.\\1 \\{\\}\\.${hash}`
    )
    const match = pattern.exec(styleTag.innerHTML)
    if (match) {
      const id = match[1]
      const filename = match[3]
      const name = match[4]
      return { id, name, filename, hash }
    }
  }
}

module.exports = findComponent
