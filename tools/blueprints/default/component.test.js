module.exports = (componentName) => ({
  content: `import React from 'react';
import { render } from '@testing-library/react';

import ${componentName} from './${componentName}';
import { I${componentName}Props } from './${componentName}.types';

describe('Test Component', () => {

  let props: I${componentName}Props;

  beforeEach(() => {
    props = {
      foo: 'bar'
    };
  });

  const renderComponent = () => render(<${componentName} {...props} />);

  it('should render foo text correctly', () => {

    props.foo = 'Bar was here';
    const { getByTestId } = renderComponent();

    const component = getByTestId('${componentName}');

    expect(component).toHaveTextContent('Bar was here');

  });

});
`,
  extension: `.test.tsx`
});
