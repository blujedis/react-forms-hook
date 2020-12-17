import React, { CSSProperties } from 'react';
import useForm from './form';

const error: CSSProperties = { fontSize: 'small', position: 'relative', top: '-1rem', margin: '0 0.5rem .2rem', color: 'red' };

export const NativeValidation = () => {

  // Get placeholder data and extend with local values.
  const initialData = {
    name: ''
  };

  const { handleReset, handleSubmit, state } = useForm({
    initialData,
    onValidateForm: (values, fields) => {

      // Just an example you'd want to iterate all
      // fields and generate the below but more verbose
      // here to bring clarity.

      const validity = fields.name.validity;
      const errors = [];

      // NOTE: Although pushing here 
      // you'll notice only one error
      // will show at a time as that's 
      // what the validity state will trigger.

      if (validity.valueMissing)
        errors.push(`Name is required.`);

      if (validity.tooShort)
        errors.push(`Name must be longer than ${(fields.name as any).minLength} characters`);

      if (errors.length)
        return {
          name: errors
        };

      return null;

    }
  });

  const onSubmit = (values, errors, e) => {
    console.log('submit');
  };

  return (
    <div >

      <h2>Native Validation <small style={{ fontSize: '.65em' }}>(ValidityState)</small></h2>

      <p>
        Example using HTML Form Validity State validation.
      </p>

      <p>
        With React Form Validation one often ignore option is to just use the native validity state to manage your validation. If your validation needs are not too complex this works quite nicely. Event though the form gets decorated with <code>novalidate</code> the validity state is still populated for native validation tags.
      </p>

      <p>We will decorate the name input as required and to have a minimum length of 5 characters.</p>

      <form onSubmit={handleSubmit(onSubmit)} onReset={handleReset}>

        <label >Name</label>
        <input name="name" type="text" required minLength={5} />
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
  title: 'ValidityState',
  component: NativeValidation
};



