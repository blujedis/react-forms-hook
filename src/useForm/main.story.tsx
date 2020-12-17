import React, { CSSProperties } from 'react';
import useForm from './form';

const error: CSSProperties = { fontSize: 'small', position: 'relative', top: '-1rem', margin: '0 0.5rem .2rem', color: 'red' };

export const CustomValidation = () => {

  // Get placeholder data and extend with local values.
  const initialData = {
    name: ''
  };

  const { handleReset, handleSubmit, state } = useForm({
    initialData,
    onValidateForm: (values) => {
      if (!values.name)
        return { name: [`Name is required.`] };
      return null;
    }
  });

  const onSubmit = (values, errors, e) => {
    console.log('submit');
  };

  return (
    <div >

      <h2>Basic Form <small style={{ fontSize: '.65em' }}>(Simple Validation)</small></h2>

      <p>
        Simple example validating single field called name and ensures that it exists.
      </p>

      <p>
        If it does NOT an object containing the name property and error is returned <code>{` { name: ['Name is required.'] } `}</code> is shown.
      </p>

      <p>
        Returning <code>null</code> OR <code>undefined</code> will result in no errors.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} >

        <label >Name</label>
        <input name="name" type="text" />
        {!state.errors.name ? null : <div style={error}>{state.errors.name.join('<br/>')}</div>}

        <div style={{ marginTop: '.5rem' }}>
          <button className="button button-primary" type="submit" style={{ marginRight: '.5rem' }}>Submit</button>
          <button className="button button-outline" type="reset">Reset</button>
        </div>

      </form>

      <pre style={{ maxHeight: '250px', overflowY: 'scroll' }}>{JSON.stringify(state, null, 2)}</pre>

    </div>


  );

};

export default {
  title: 'Simple',
  component: CustomValidation
};



