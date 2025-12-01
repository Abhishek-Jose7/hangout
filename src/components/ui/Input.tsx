import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  fullWidth = false,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId();
  const id = props.id || `input-${generatedId}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`px-4 py-3 bg-white border shadow-sm border-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-indigo-500 block rounded-xl text-base transition-all duration-200 focus:ring-2 focus:ring-opacity-20 ${fullWidth ? 'w-full' : ''
          } ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>}
    </div>
  );
}