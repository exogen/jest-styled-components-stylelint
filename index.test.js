require('./index')({ failOnError: false })
const React = require('react')
const styled = require('styled-components').default
const TestRenderer = require('react-test-renderer')

test('causes styles with lint to log errors', () => {
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
  // prettier-ignore
  const Title = styled.h1`
    color: red;
  `
  const wrapper = TestRenderer.create(
    <Title>Who wrote these styles anyway??</Title>
  )
  expect(wrapper.toJSON()).toMatchSnapshot()
})

test('passes stylelint', () => {
  // prettier-disable
  const Title = styled.h1`
    color: red;
  `
  TestRenderer.create(<Title />)
})

test('does not pass stylelint', () => {
  // prettier-disable
  const Title = styled.h1`
    color: {oops!}
  `
  TestRenderer.create(<Title />)
})

test('works on nested style rules', () => {
  // prettier-disable
  const Link = styled.a`
    text-decoration: underline;
  `
  // prettier-disable
  const Title = styled.h1.attrs({
    children: <Link />
  })`
    color: red;

    a:link {
      text-decoration: 5;

      @media (min-width: 100px) {
        width: 10frobs;
      }
    }
  `
  TestRenderer.create(<Title />)
})
