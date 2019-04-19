import * as React from 'react';
import { Form } from 'react-final-form';

type Props = {
  onSubmit: (e: any) => void;
  children: React.ReactNode;
  validate?: (values: any) => any;
};

function FormComponent({ onSubmit, validate, children }: Props) {
  const content = () => children;

  return (
    <Form
      onSubmit={onSubmit}
      validate={validate && validate}
      render={content}
    />
  );
}

export default FormComponent;
