// Generated with util/create-component.js
import React from 'react';

import { MyComponentProps } from './MyComponent.types';

import './MyComponent.scss';

const MyComponent: React.FC<MyComponentProps> = ({ foo }) => (
    <div data-testid='MyComponent' className='foo-bar'>{foo}</div>
);

export default MyComponent;

