import type { ChangeEvent, InputHTMLAttributes, JSX } from 'react';
import type { FieldPath, FieldValues, RegisterOptions, UseFormRegister } from 'react-hook-form';

import { CloseOutlined, EyeFilled, EyeInvisibleFilled } from '@ant-design/icons';
import { clsx } from 'clsx';
import { useRef, useState } from 'react';

import styles from './text-input.module.css';

type TextInputProps<TFieldValues extends FieldValues> = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  name: FieldPath<TFieldValues>;
  register?: UseFormRegister<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
};

const TextInput = <TFieldValues extends FieldValues>({
  label,
  name,
  type = 'text',
  register,
  rules,
  placeholder,
  className,
  value,
  defaultValue,
  onChange,
  ...props
}: TextInputProps<TFieldValues>): JSX.Element => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [inputValue, setInputValue] = useState(() => String(value ?? defaultValue ?? ''));
  const inputWrapperRef = useRef<HTMLDivElement | null>(null);
  const isPassword = type === 'password';
  const registration = register?.(name, rules);
  const hasValue = String(value ?? inputValue) !== '';

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(event.target.value);
    void registration?.onChange(event);
    onChange?.(event);
  };

  const clearInput = (): void => {
    const input = inputWrapperRef.current?.querySelector<HTMLInputElement>('input');
    if (!input) return;

    const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (valueSetter) {
      valueSetter.call(input, '');
    } else {
      input.value = '';
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    setInputValue('');
    input.focus();
  };

  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label} htmlFor={name}>
          {label}
        </label>
      ) : null}
      <div className={styles.inputWrapper} ref={inputWrapperRef}>
        <input
          id={name}
          type={isPassword && isPasswordVisible ? 'text' : type}
          placeholder={placeholder}
          className={clsx(
            styles.input,
            isPassword && styles.passwordInput,
            hasValue && styles.clearableInput,
            className
          )}
          {...registration}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        {hasValue ? (
          <button
            className={clsx(styles.clearButton, isPassword && styles.clearButtonWithToggle)}
            type="button"
            aria-label="Очистить поле"
            disabled={props.disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearInput}
          >
            <CloseOutlined />
          </button>
        ) : null}
        {isPassword ? (
          <button
            className={styles.passwordToggle}
            type="button"
            aria-label={isPasswordVisible ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={isPasswordVisible}
            disabled={props.disabled}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? (
              <EyeInvisibleFilled style={{ fontSize: '24px' }} />
            ) : (
              <EyeFilled style={{ fontSize: '24px' }} />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default TextInput;
