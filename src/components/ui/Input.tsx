import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  hint,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = props.id || `input-${generatedId}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          className={`
            w-full
            px-4 py-3
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            bg-white 
            border-2 border-slate-200
            rounded-xl
            text-slate-800 text-base
            placeholder:text-slate-400
            transition-all duration-200
            focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10
            hover:border-slate-300
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''} 
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}