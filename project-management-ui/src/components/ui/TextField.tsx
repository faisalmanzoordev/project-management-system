import React, { forwardRef, useId } from "react";

export type TextFieldProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size"
> & {
    label?: string;
    hint?: string;
    error?: string;
    containerClassName?: string;
    inputClassName?: string;
    leftAdornment?: React.ReactNode;
    rightAdornment?: React.ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    (
        {
            label,
            hint,
            error,
            containerClassName,
            inputClassName,
            leftAdornment,
            rightAdornment,
            id,
            disabled,
            ...props
        },
        ref
    ) => {
        const autoId = useId();
        const fieldId = id ?? `tf-${autoId}`;
        const hintId = hint ? `${fieldId}-hint` : undefined;
        const errorId = error ? `${fieldId}-error` : undefined;
        const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

        return (
            <div className={["w-full", containerClassName ?? ""].join(" ")}>
                {label ? (
                    <label
                        htmlFor={fieldId}
                        className="mb-1 block text-sm font-medium text-slate-700"
                    >
                        {label}
                    </label>
                ) : null}

                <div
                    className={[
                        "flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 shadow-sm",
                        "ring-1 ring-inset transition",
                        disabled ? "opacity-60" : "",
                        error ? "ring-rose-200" : "ring-slate-200 hover:ring-slate-300",
                        "focus-within:ring-4",
                        error ? "focus-within:ring-rose-500/15" : "focus-within:ring-slate-900/10",
                    ].join(" ")}
                >
                    {leftAdornment ? (
                        <span className="inline-flex items-center text-slate-500">
                            {leftAdornment}
                        </span>
                    ) : null}

                    <input
                        ref={ref}
                        id={fieldId}
                        disabled={disabled}
                        aria-invalid={Boolean(error)}
                        aria-describedby={describedBy}
                        className={[
                            "w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400",
                            "focus:outline-none",
                            inputClassName ?? "",
                        ].join(" ")}
                        {...props}
                    />

                    {rightAdornment ? (
                        <span className="inline-flex items-center">{rightAdornment}</span>
                    ) : null}
                </div>

                {hint ? (
                    <div id={hintId} className="mt-1 text-xs text-slate-500">
                        {hint}
                    </div>
                ) : null}

                {error ? (
                    <div id={errorId} className="mt-1 text-xs font-semibold text-rose-700">
                        {error}
                    </div>
                ) : null}
            </div>
        );
    }
);

TextField.displayName = "TextField";