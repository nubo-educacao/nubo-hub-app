import { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type ButtonProps = {
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({ children, ...rest }: ButtonProps) => {
  return (
    <button className="btn" {...rest}>
      {children}
    </button>
  );
};

export default Button;
