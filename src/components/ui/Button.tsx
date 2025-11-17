import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const baseClasses =
  'inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-500 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-95 active:translate-y-px disabled:opacity-60 disabled:shadow-none';

const Button = ({ children, className, ...rest }: ButtonProps) => {
  return (
    <button className={`${baseClasses} ${className ?? ''}`.trim()} {...rest}>
      {children}
    </button>
  );
};

export default Button;
