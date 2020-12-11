// Generated with util/create-component.js
import React from 'react';
import { render } from '@testing-library/react';

import MyComponent from './MyComponent';
import { MyComponentProps } from './MyComponent.types';

describe('Test Component', () => {
  let props: MyComponentProps;

  beforeEach(() => {
    props = {
      foo: 'bar'
    };
  });

  const renderComponent = () => render(<MyComponent {...props} />);

  it('should render foo text correctly', () => {
    props.foo = 'harvey was here';
    const { getByTestId } = renderComponent();

    const component = getByTestId('MyComponent');

    expect(component).toHaveTextContent('harvey was here');
  });
});
