interface FieldErrorProps {
  error: string;
  id?: string;
}

export function FieldError({ error, id }: FieldErrorProps) {
  return (
    <p id={id} role="alert" className="mono-error">
      {`! ${error}`}
    </p>
  );
}
