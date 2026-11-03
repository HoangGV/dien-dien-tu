import React from 'react';

export interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
  variant = 'secondary',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  let variantClass = 'neo-btn-secondary';
  if (variant === 'primary') variantClass = 'neo-btn-primary';
  else if (variant === 'danger') variantClass = 'neo-btn-danger';
  else if (variant === 'success') variantClass = 'neo-btn-success';
  else if (variant === 'warning') variantClass = 'neo-btn-warning';

  return (
    <button
      className={`neo-btn ${variantClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children ? <span className="font-extrabold tracking-wide">{children}</span> : null}
    </button>
  );
};
