import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    success,
    leftIcon,
    rightIcon,
    hint,
    className,
    id,
    onFocus,
    onBlur,
    type,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={isPassword && showPassword ? 'text' : type}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={cn(
            'h-11 w-full rounded-xl border bg-white dark:bg-slate-900 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-200 focus-ring',
            leftIcon && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            error
              ? 'border-danger-400 dark:border-danger-600'
              : success
                ? 'border-success-400 dark:border-success-600'
                : focused
                  ? 'border-primary-500 dark:border-primary-400'
                  : 'border-slate-300 dark:border-slate-700',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        ) : (
          rightIcon && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {rightIcon}
            </span>
          )
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});