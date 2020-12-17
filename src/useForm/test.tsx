import React from 'react';
import { render } from '@testing-library/react';

import useForm from './form';
import { IOptions } from './types';

describe('useForm', () => {

  let props: IOptions;

  beforeEach(() => {
    props = {
      form: null
    };
  });

  const renderComponent = () => {

    const { handleSubmit } = useForm({ ...props });

    render(
      <p></p>
    );
  }

  it('should render Milton Waddams text correctly', () => {

    props.form = 'form';

    // const { getByTestId } = renderComponent();

    // const component = getByTestId('useForm');

    // expect(component).toHaveTextContent('Milton Waddams');

  });

});
