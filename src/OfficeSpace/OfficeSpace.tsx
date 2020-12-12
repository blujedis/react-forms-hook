import React from 'react';

import { IOfficeSpaceProps } from './OfficeSpace.types';
import './OfficeSpace.scss';

const OfficeSpace: React.FC<IOfficeSpaceProps> = ({ label }) => (
  <div data-testid='OfficeSpace' className='OfficeSpace'>{label}</div>
);

export default OfficeSpace;

