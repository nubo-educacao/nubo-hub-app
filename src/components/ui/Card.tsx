import { ReactNode } from 'react';
import './Card.css';

type CardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

const Card = ({ title, subtitle, children, footer }: CardProps) => {
  return (
    <div className="card">
      <header className="card-header">
        <h3>{title}</h3>
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </header>
      {children ? <div className="card-body">{children}</div> : null}
      {footer ? <div className="card-footer">{footer}</div> : null}
    </div>
  );
};

export default Card;
