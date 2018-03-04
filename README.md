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

### toPassStylelint

Upon configuration, `jest-styled-components-stylelint` will add a matcher called
`toPassStylelint`.

If you enable the `failOnError` option, this assertion is run automatically for
you at the end of each test (using `afterEach`). All lint encountered during the
execution of the test will be checked.

If you’d rather be more explicit in your tests, you can use this matcher
directly by passing a function to `expect()`. The function should cause the
components you want to check to be rendered. Like so:

```jsx
test('passes stylelint', () => {
  const Title = styled.h1`
    color: red;
  `
  expect(() => TestRenderer.create(<Title />)).toPassStylelint()
})

test('does not pass stylelint', () => {
  const Title = styled.h1`
    color: {oops!}
  `
  expect(() => TestRenderer.create(<Title />)).not.toPassStylelint()
})
```

### Options

#### failOnError

Whether there should be an automatic assertion at the end of every test (added
via `afterEach`) that asserts there were no stylelint errors when running the
test.

If `true`, stylelint errors will be logged and cause the test to fail.

If `false`, stylelint errors will be logged but the test won’t fail. In this
case, you should use the `toPassStylelint` matcher (see above) when you want
tests to fail due to linting.

#### More…

All remaining options are passed along to [stylis-plugin-stylelint][], so refer
to its documentation.

[stylis-plugin-stylelint]: https://github.com/exogen/stylis-plugin-stylelint
