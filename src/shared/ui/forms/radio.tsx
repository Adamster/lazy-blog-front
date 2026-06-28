"use client";

interface RadioOption {
  value: string;
  label: string;
}

// Native input kept `sr-only` (a11y); the visible square box is its `peer`.
function Radio({
  name,
  option,
  checked,
  onChange,
  disabled,
}: {
  name: string;
  option: RadioOption;
  checked: boolean;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = `${name}-${option.value}`;
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={option.value}
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(option.value)}
      />
      <span
        aria-hidden="true"
        className={`flex size-[18px] flex-none items-center justify-center border-2 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--m-accent)] ${
          checked ? "border-[var(--m-accent)]" : "border-[var(--m-dim)]"
        }`}
      >
        <span
          className={`size-2 ${checked ? "bg-[var(--m-accent)]" : "bg-transparent"}`}
        />
      </span>
      <span className="text-[14px] leading-none text-[var(--m-fg)]">
        {option.label}
      </span>
    </label>
  );
}

interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  required = false,
  disabled = false,
}: RadioGroupProps) {
  return (
    <div role="radiogroup" aria-label={label}>
      {label ? (
        <div className="mono-field-label">
          {label}
          {required ? (
            <span className="ml-1 text-[var(--m-accent)]">*</span>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-4">
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            option={option}
            checked={value === option.value}
            onChange={onChange}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export type { RadioOption };
