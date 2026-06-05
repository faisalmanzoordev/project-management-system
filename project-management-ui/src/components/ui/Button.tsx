import React from "react";

type Variant = "primary" | "secondary" | "soft" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
};

function classesForVariant(variant: Variant): string {
    switch (variant) {
        case "primary":
            return "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900/20";
        case "secondary":
            return "bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:ring-slate-900/10";
        case "soft":
            return "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-900/10";
        case "danger":
            return "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/20";
        case "ghost":
            return "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-900/10";
        default:
            return "bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-slate-50";
    }
}

function classesForSize(size: Size): string {
    switch (size) {
        case "sm":
            return "px-3 py-2 text-sm";
        case "md":
            return "px-4 py-2 text-sm";
        case "lg":
            return "px-5 py-3 text-base";
        default:
            return "px-4 py-2 text-sm";
    }
}

export const Button: React.FC<ButtonProps> = ({
    variant = "secondary",
    size = "md",
    leftIcon,
    rightIcon,
    className,
    disabled,
    children,
    ...props
}) => {
    return (
        <button
            {...props}
            disabled={disabled}
            className={[
                "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition",
                "focus:outline-none focus:ring-4",
                "disabled:cursor-not-allowed disabled:opacity-60",
                classesForVariant(variant),
                classesForSize(size),
                className ?? "",
            ].join(" ")}
        >
            {leftIcon ? <span className="inline-flex items-center">{leftIcon}</span> : null}
            <span className="whitespace-nowrap">{children}</span>
            {rightIcon ? <span className="inline-flex items-center">{rightIcon}</span> : null}
        </button>
    );
};