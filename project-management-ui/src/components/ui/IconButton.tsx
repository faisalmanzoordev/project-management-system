import React from "react";

type Tone = "neutral" | "danger";

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  ariaLabel: string;
  icon: React.ReactNode;
};

export const IconButton: React.FC<IconButtonProps> = ({
  tone = "neutral",
  ariaLabel,
  icon,
  className,
  disabled,
  ...props
}) => {
  const toneClasses =
    tone === "danger"
      ? "text-rose-700 hover:bg-rose-50 ring-rose-200 focus:ring-rose-500/20"
      : "text-slate-700 hover:bg-slate-100 ring-slate-200 focus:ring-slate-900/10";

  return (
    <button
      {...props}
      disabled={disabled}
      type={props.type ?? "button"}
      aria-label={ariaLabel}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
        "ring-1 ring-inset focus:outline-none focus:ring-4",
        "disabled:cursor-not-allowed disabled:opacity-60",
        toneClasses,
        className ?? "",
      ].join(" ")}
    >
      {icon}
    </button>
  );
};