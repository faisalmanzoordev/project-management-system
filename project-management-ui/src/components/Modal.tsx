import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconX } from "./ui/icons";

let bodyLockCount = 0;

function lockBodyScroll() {
    bodyLockCount += 1;
    if (bodyLockCount !== 1) return;

    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.dataset.pmOverflow = body.style.overflow || "";
    body.dataset.pmPaddingRight = body.style.paddingRight || "";

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
}

function unlockBodyScroll() {
    bodyLockCount = Math.max(0, bodyLockCount - 1);
    if (bodyLockCount !== 0) return;

    const body = document.body;
    body.style.overflow = body.dataset.pmOverflow ?? "";
    body.style.paddingRight = body.dataset.pmPaddingRight ?? "";

    delete body.dataset.pmOverflow;
    delete body.dataset.pmPaddingRight;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selectors = [
        "a[href]",
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
    ].join(",");

    return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
        (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
    );
}

export type ModalProps = {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    lockScroll?: boolean;
    closeOnOverlayClick?: boolean;
    maxWidthClassName?: string;
};

const Modal: React.FC<ModalProps> = ({
    title,
    isOpen,
    onClose,
    children,
    lockScroll = true,
    closeOnOverlayClick = true,
    maxWidthClassName = "max-w-2xl",
}) => {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // keep latest onClose stable (prevents effect re-run per keystroke)
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    const [render, setRender] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            requestAnimationFrame(() => setAnimateIn(true));
        } else if (render) {
            setAnimateIn(false);
            const t = window.setTimeout(() => setRender(false), 180);
            return () => window.clearTimeout(t);
        }
    }, [isOpen, render]);

    useEffect(() => {
        if (!render) return;

        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
        if (lockScroll) lockBodyScroll();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onCloseRef.current();
                return;
            }

            if (e.key === "Tab" && panelRef.current) {
                const focusables = getFocusableElements(panelRef.current);
                if (focusables.length === 0) return;

                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                const active = document.activeElement as HTMLElement | null;

                if (e.shiftKey) {
                    if (!active || active === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (active === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        const focusTimer = window.setTimeout(() => {
            const panel = panelRef.current;
            if (!panel) return;

            const active = document.activeElement as HTMLElement | null;
            if (active && panel.contains(active)) return;

            const focusables = getFocusableElements(panel);
            if (focusables.length > 0) focusables[0].focus();
            else panel.focus();
        }, 0);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);

            if (lockScroll) unlockBodyScroll();

            previouslyFocusedRef.current?.focus?.();
            previouslyFocusedRef.current = null;
        };
    }, [render, lockScroll]);

    if (!render) return null;

    return createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
            <div className="fixed inset-0 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className={[
                        "fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-200",
                        animateIn ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    onMouseDown={(e) => {
                        if (!closeOnOverlayClick) return;
                        if (e.target === e.currentTarget) onCloseRef.current();
                    }}
                />

                {/* Container */}
                <div className="relative flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
                    {/* Panel */}
                    <div
                        ref={panelRef}
                        tabIndex={-1}
                        className={[
                            "relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none",
                            maxWidthClassName,
                            "transition duration-200 will-change-transform",
                            animateIn
                                ? "opacity-100 translate-y-0 sm:scale-100"
                                : "opacity-0 translate-y-6 sm:translate-y-0 sm:scale-95",
                        ].join(" ")}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
                            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                            <button
                                type="button"
                                onClick={() => onCloseRef.current()}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ring-slate-200 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-900/10"
                                aria-label="Close"
                            >
                                <IconX />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-5 py-5">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;