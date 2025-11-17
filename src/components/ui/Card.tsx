import { ReactNode } from 'react';

type CardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

const Card = ({ title, subtitle, children, footer }: CardProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200/60 bg-white p-4 shadow-lg shadow-gray-900/5">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
      </header>
      {children ? <div className="text-slate-800 leading-6">{children}</div> : null}
      {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
    </div>
  );
};

export default Card;
