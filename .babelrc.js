module.exports = {
  presets: ['react'],
  plugins: [
    [
      'styled-components',
      { ssr: true, minify: process.env.NODE_ENV !== 'test' }
    ]
  ]
}
