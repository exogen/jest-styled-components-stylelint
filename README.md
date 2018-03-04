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

Then in your tests, just make sure something renders your components:

```js
import TestRenderer from 'react-test-renderer'

test('renders successfully', () => {
  const wrapper = TestRenderer.create(<Button />)
  expect(wrapper.toJSON()).toMatchSnapshot()
})
```

Any stylelint errors will be written to stderr during the test run. And if
`failOnError` is true, the test will also fail!

### Options

[See the options for stylis-plugin-stylelint](https://github.com/exogen/stylis-plugin-stylelint).
