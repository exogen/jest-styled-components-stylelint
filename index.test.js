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
  const Title = styled.h1`
    color: red;
  `
  TestRenderer.create(<Title />)
})

test('does not pass stylelint', () => {
  const Title = styled.h1`
    color: {oops!}
  `
  TestRenderer.create(<Title />)
})
