import { useEffect, useMemo, useRef, useState } from "react";
import { IconChevronDown } from "./icons";

export type DropdownItem<T> = {
    value: T;
    label: string;
    description?: string;
    disabled?: boolean;
};

export type DropdownProps<T> = {
    label?: string;
    items: Array<DropdownItem<T>>;
    value: T | null;
    onChange: (value: T) => void;

    placeholder?: string;
    buttonClassName?: string;
    menuClassName?: string;
    renderValue?: (value: T) => string;
};

function isEqual(a: unknown, b: unknown): boolean {
    return a === b;
}

export function Dropdown<T>({
    label,
    items,
    value,
    onChange,
    placeholder = "Select...",
    buttonClassName,
    menuClassName,
    renderValue,
}: DropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const selected = useMemo(() => {
        if (value === null) return null;
        return items.find((i) => isEqual(i.value, value)) ?? null;
    }, [items, value]);

    const buttonText = useMemo(() => {
        if (!selected) return placeholder;
        return renderValue ? renderValue(selected.value) : selected.label;
    }, [placeholder, renderValue, selected]);

    useEffect(() => {
        if (!open) return;

        const onDocClick = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (btnRef.current?.contains(target)) return;
            if (menuRef.current?.contains(target)) return;
            setOpen(false);
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", onDocClick);
        document.addEventListener("keydown", onKey);

        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="w-full">
            {label ? <div className="mb-1 text-sm font-medium text-slate-700">{label}</div> : null}

            <div className="relative">
                <button
                    ref={btnRef}
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className={[
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5",
                        "bg-white text-left text-sm ring-1 ring-inset ring-slate-200",
                        "shadow-sm hover:ring-slate-300",
                        "focus:outline-none focus:ring-4 focus:ring-slate-900/10",
                        selected ? "text-slate-900" : "text-slate-500",
                        buttonClassName ?? "",
                    ].join(" ")}
                    aria-haspopup="menu"
                    aria-expanded={open}
                >
                    <span className="min-w-0 truncate">{buttonText}</span>
                    <span className={["shrink-0 text-slate-500 transition", open ? "rotate-180" : ""].join(" ")}>
                        <IconChevronDown />
                    </span>
                </button>

                {open ? (
                    <div
                        ref={menuRef}
                        role="menu"
                        className={[
                            "absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white",
                            "shadow-lg",
                            menuClassName ?? "",
                        ].join(" ")}
                    >
                        <div className="max-h-64 overflow-y-auto p-1">
                            {items.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-slate-500">No options</div>
                            ) : (
                                items.map((item) => {
                                    const active = value !== null && isEqual(item.value, value);
                                    const disabled = Boolean(item.disabled);

                                    return (
                                        <button
                                            key={String((item as any).value) + item.label}
                                            role="menuitem"
                                            type="button"
                                            disabled={disabled}
                                            onClick={() => {
                                                if (disabled) return;
                                                onChange(item.value);
                                                setOpen(false);
                                            }}
                                            className={[
                                                "flex w-full flex-col rounded-lg px-3 py-2 text-left transition",
                                                disabled ? "cursor-not-allowed opacity-50" : "hover:bg-slate-50",
                                                active ? "bg-slate-900 text-white hover:bg-slate-900" : "text-slate-800",
                                            ].join(" ")}
                                        >
                                            <span className="text-sm font-semibold">{item.label}</span>
                                            {item.description ? (
                                                <span className={["text-xs", active ? "text-white/80" : "text-slate-500"].join(" ")}>
                                                    {item.description}
                                                </span>
                                            ) : null}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}