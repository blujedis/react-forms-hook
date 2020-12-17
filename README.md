# React Forms Hook

Lightweight forms validation hook for React.

Storybook docs coming soon, for now here are the basics.

## Installation

```sh
yarn add @blujedis/react-form-hooks
```

## Usage

Init hook and decorate your form with submit handler.

```tsx
import React, { CSSProperties } from 'react';
import useForm from 'react-forms-hook';

const error: CSSProperties = { fontSize: 'small', position: 'relative', top: '-1rem', margin: '0 0.5rem .2rem', color: 'red' };

const MyComponent = () => {

  const data = {
    name: 'Milton Waddams'
  };

  const { handleSubmit, state } = useForm({
    initialData: data
  });

  const onSubmit = (values) => {
    console.log('My form values:', values);
  };

  return (
    <h2>React Forms Hook</h2>
    <form onSubmit={handleSubmit(onSubmit)}>

      <div>
        <label>Name</label>
        <input name="name" type="text" placeholder="Your name"/>
        {!state.errors.name ? null : <div style={error}>{state.errors.name.join('<br/>')}</div>}
      </div>

      <button className="button button-primary" type="submit" style={{ marginRight: '.5rem' }}>Submit</button>
      <button className="button button-outline" type="reset">Reset</button>

    </form>

  );
};

export default MyComponent;
```