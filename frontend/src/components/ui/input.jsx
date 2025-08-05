import React from 'react';

export function Input({
  className = '',
  type = 'text',
  error,
  ...props
}) {
  return (
    <input
      type={type}
      className={`
        block w-full rounded-md border-gray-300
        focus:border-primary-500 focus:ring-primary-500
        disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
        ${className}
      `}
      {...props}
    />
  );
}

export default Input; 