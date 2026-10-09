import type { InputHTMLAttributes, JSX } from 'react';
import type { FieldPath, FieldValues, RegisterOptions, UseFormRegister } from 'react-hook-form';

import { EyeFilled, EyeInvisibleFilled } from '@ant-design/icons';
import { clsx } from 'clsx';
import { useState } from 'react';

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
  ...props
}: TextInputProps<TFieldValues>): JSX.Element => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={styles.wrapper}>
      {label ? (
        <label className={styles.label} htmlFor={name}>
          {label}
        </label>
      ) : null}
      <div className={styles.inputWrapper}>
        <input
          id={name}
          type={isPassword && isPasswordVisible ? 'text' : type}
          placeholder={placeholder}
          className={clsx(styles.input, isPassword && styles.passwordInput, className)}
          {...(register ? register(name, rules) : {})}
          {...props}
        />
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
