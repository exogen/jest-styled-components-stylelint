# jest-styled-components-stylelint

A helper for running stylelint on your styled-components styles **at runtime**.

That means it lints the resulting styles and doesn’t get tripped up by all your
dynamic interpolations!

## Usage

In a Jest setup file like `setupTestFramework.js`:

```js
import configure from 'jest-styled-components-stylelint'

// NOTE: This should be configured before `styled-components` and `stylis` are
// imported anywhere!
configure({
  failOnError: false,
  formatter: 'string'
})
```

### Options

[See the options for stylis-plugin-stylelint](https://github.com/exogen/stylis-plugin-stylelint).
