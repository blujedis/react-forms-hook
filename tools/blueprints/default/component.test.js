module.exports = (componentName) => ({
  content: `import React from 'react';
import { render } from '@testing-library/react';

import ${componentName} from './${componentName}';
import { I${componentName}Props } from './${componentName}.types';

describe('${componentName}', () => {

  let props: I${componentName}Props;

  beforeEach(() => {
    props = {
      label: 'Milton Waddams'
    };
  });

  const renderComponent = () => render(<${componentName} {...props} />);

  it('should render Milton Waddams text correctly', () => {

    props.label = 'Milton Waddams';
    const { getByTestId } = renderComponent();

    const component = getByTestId('${componentName}');

    expect(component).toHaveTextContent('Milton Waddams');

  });

});
`,
  extension: `.test.tsx`
});
