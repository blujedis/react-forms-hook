module.exports = (componentName) => ({
  content: `import React from 'react';

import { I${componentName}Props } from './${componentName}.types';
import './${componentName}.scss';

const ${componentName}: React.FC<I${componentName}Props> = ({ label }) => (
  <div data-testid='${componentName}' className='${componentName}'>{label}</div>
);

export default ${componentName};

`,
  extension: `.tsx`
});
