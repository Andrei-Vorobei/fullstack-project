import type { ButtonHTMLAttributes, JSX } from 'react';

import { clsx } from 'clsx';

import styles from './button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const Button = ({
  children = 'Submit',
  className,
  type = 'submit',
  variant = 'primary',
  ...props
}: ButtonProps): JSX.Element => {
  return (
    <button
      className={clsx(styles.button, variant === 'primary' ? styles.primary : styles.secondary, className)}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
