import React, { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      id,
      name,
      type = "text",
      placeholder = "",
      error = "",
      helperText = "",
      disabled = false,
      readOnly = false,
      fullWidth = true,
      required = false,
      className = "",
      containerClassName = "",
      labelClassName = "",
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div
        className={`mb-4 ${containerClassName} ${fullWidth ? "w-full" : ""}`}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName} ${
              required
                ? 'after:content-["*"] after:ml-0.5 after:text-red-500'
                : ""
            }`}
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          className={`
          px-3 py-2 bg-white border shadow-sm border-gray-300 placeholder-gray-400 
          focus:outline-none focus:border-[#1c6ead] focus:ring-[#1c6ead] block rounded-md sm:text-sm focus:ring-1
          ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          }
          ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
          ${readOnly ? "bg-gray-50" : ""}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
          {...props}
        />

        {(error || helperText) && (
          <p
            className={`mt-1 text-sm ${
              error ? "text-red-600" : "text-gray-500"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
