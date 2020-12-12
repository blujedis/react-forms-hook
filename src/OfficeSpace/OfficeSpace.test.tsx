import React from 'react';
import { render } from '@testing-library/react';

import OfficeSpace from './OfficeSpace';
import { IOfficeSpaceProps } from './OfficeSpace.types';

describe('OfficeSpace', () => {

  let props: IOfficeSpaceProps;

  beforeEach(() => {
    props = {
      label: 'Milton Waddams'
    };
  });

  const renderComponent = () => render(<OfficeSpace {...props} />);

  it('should render Milton Waddams text correctly', () => {

    props.label = 'Milton Waddams';
    const { getByTestId } = renderComponent();

    const component = getByTestId('OfficeSpace');

    expect(component).toHaveTextContent('Milton Waddams');

  });

});
