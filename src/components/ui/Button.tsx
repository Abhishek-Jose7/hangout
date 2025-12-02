import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center 
    font-semibold tracking-tight
    rounded-xl
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
    select-none
  `;

  const variantStyles = {
    primary: `
      bg-indigo-600 text-white 
      hover:bg-indigo-700 
      hover:shadow-lg hover:shadow-indigo-500/25
      focus:ring-indigo-500 
      border border-transparent
    `,
    secondary: `
      bg-slate-100 text-slate-800 
      hover:bg-slate-200 
      focus:ring-slate-400 
      border border-slate-200
    `,
    outline: `
      bg-transparent text-slate-700 
      border-2 border-slate-200 
      hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50/50
      focus:ring-indigo-500
    `,
    ghost: `
      bg-transparent text-slate-600 
      hover:bg-slate-100 hover:text-slate-900 
      focus:ring-slate-400 
      border border-transparent
    `,
    gradient: `
      bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 
      text-white 
      hover:shadow-lg hover:shadow-indigo-500/30 
      hover:from-indigo-700 hover:via-violet-700 hover:to-purple-700
      focus:ring-indigo-500
      border border-transparent
    `,
    danger: `
      bg-red-600 text-white 
      hover:bg-red-700 
      hover:shadow-lg hover:shadow-red-500/25
      focus:ring-red-500 
      border border-transparent
    `,
  };

  const sizeStyles = {
    xs: 'px-3 py-1.5 text-xs gap-1.5',
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg gap-3',
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  const spinnerSize = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
    xl: 'h-6 w-6',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <svg 
            className={`animate-spin ${spinnerSize[size]} text-current`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="sr-only">Loading</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}