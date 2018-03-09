require('./index')({ failOnError: false })
require('jest-styled-components')
const React = require('react')
const { default: styled, injectGlobal } = require('styled-components')
const TestRenderer = require('react-test-renderer')

test('causes styles with lint to log errors', () => {
  // prettier-ignore
  injectGlobal`
    .test {
      test-decoration: underlin
    }
  `
  // prettier-ignore
  const Title = styled.h1`
    color: red;
    line-height: -
  `
  const wrapper = TestRenderer.create(
    <Title>Who wrote these styles anyway??</Title>
  )
  expect(wrapper.toJSON()).toMatchSnapshot()
})

test('styles without lint log nothing', () => {
  injectGlobal`
    .test {
      text-decoration: underline;
    }
  `
  // prettier-ignore
  const Title = styled.h1`
    color: red;
  `
  TestRenderer.create(<Title />)
})

test('does not pass stylelint', () => {
  // prettier-ignore
  const Title = styled.h1`
    color: {oops!}
  `
  TestRenderer.create(<Title />)
})

test('works on nested style rules', () => {
  // prettier-ignore
  const Link = styled.a`
    text-decoration: undrln
  `
  // prettier-ignore
  const Title = styled.h1.attrs({
    children: <Link />
  })`
    color: red;

    a:link {
      text-decoration: 5;


      @media (min-width: ) {
        width: 10frobs
      }
    }
  `
  TestRenderer.create(<Title />)
})

test('handles styles without newlines', () => {
  // prettier-ignore
  injectGlobal`.selector { color:black }`
  // prettier-ignore
  const Link = styled.a`text-decroation: underline`
  TestRenderer.create(<Link />)
})

test('handles empty styles', () => {
  // prettier-ignore
  injectGlobal``
  // prettier-ignore
  const Link = styled.a``
  TestRenderer.create(<Link />)
})

test('handles styles with weird newline situations', () => {
  // prettier-ignore
  const Link = styled.a`text-decroation: value(
      one,
      two,
      three)
  `
  TestRenderer.create(<Link />)
})
