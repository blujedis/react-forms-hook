import React from 'react';
import useSWR from 'swr';
import useForm from './form';

const wrapper = {
  padding: '1rem 0 3rem',
  fontFamily: 'Helvetica Neue, Helvetica, Arial',
  fontWeight: 300,
  width: '800px',
  margin: '0 auto'
};

const field = {
  marginBottom: '.75rem',
  width: '100%'
};

const label = {
  display: 'block',
  marginBottom: '.3rem'
  // paddingLeft: '.5rem'
};

const input = {
  display: 'block',
  margin: '.3rem 0',
  padding: '.5rem .75rem',
  width: '100%'
}

const file = {
  ...input,
  padding: '.5rem, 0'
}

const btnWrapper = {
  margin: '1.5rem 0',
};

const btn = {
  padding: '.5rem .75rem',
  border: '1px solid #ccc',
  marginRight: '.5rem'
};

export default {
  title: 'useForm'
};

const FullName = (props) => {
  return (
    <div style={field}>
      <label style={label}>First Name</label>
      <input name="name" type="text" style={input} />
    </div>
  );
}

export const Basic = () => {

  const { data } = useSWR('https://jsonplaceholder.typicode.com/users/1');

  const initialData = {
    ...data,
    details: {
      timezone: 'pst'
    },
    enabled: true
  }

  const { handleReset, handleSubmit, state } = useForm({
    initialData,
    onValidateForm: (values) => {
      return false;
    }
  });

  const onReset = (values, e) => {
    //  console.log(values);
  };

  const onSubmit = (values, errors, e) => {
    console.log(values);
  };

  return (
    <div style={wrapper}>

      <h1>From Validation Hook Example</h1>

      <form onSubmit={handleSubmit(onSubmit)} onReset={handleReset(onReset)}>

        <p>
          Touched: {state.touched.join(', ')} <br />
          Dirty: {state.dirty.join(', ')}<br />
          isTouched: {state.isTouched} <br />
          isDirty: {state.isDirty}<br />
          Submitted: {state.submitted + ''}
        </p>

        <FullName />

        <div style={field}>
          <label style={label}>Email</label>
          <input name="email" type="email" style={input} required />
        </div>

        <div style={field}>
          <label style={label}>Timezome</label>
          <select name="details.timezone">
            <option value="">Please Select</option>
            <option value="est">EST</option>
            <option value="cst">CST</option>
            <option value="pst">PST</option>
          </select>
        </div>

        <div style={field}>
          <label style={label}>Roles</label>
          <select name="roles" multiple defaultValue={['user', 'manager']}>
            <option value="">Please Select</option>
            <option value="user">user</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </div>

        <div style={field}>
          <label style={label}>Upload File</label>
          <input name="file" type="file" style={file} />
        </div>


        <div style={field}>
          <label>Main Office</label> <input name="location" type="radio" value="main" />&nbsp;
          <label>Basement</label> <input name="location" type="radio" value="basement" defaultChecked />
        </div>

        <div style={field}>
          <label>Enabled</label> <input name="enabled" type="checkbox" />
        </div>

        <div style={btnWrapper}>
          <button style={btn} type="submit">Submit</button>
          <button style={btn} type="reset">Reset</button>
        </div>

      </form>

      {/* <pre>{JSON.stringify(state)}</pre> */}

    </div>

  );

};



