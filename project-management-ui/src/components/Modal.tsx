import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

let bodyLockCount = 0;

function lockBodyScroll() {
    bodyLockCount += 1;
    if (bodyLockCount !== 1) return;

    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.dataset.pmOverflow = body.style.overflow || "";
    body.dataset.pmPaddingRight = body.style.paddingRight || "";

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
    }
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
    maxWidthClassName?: string; // e.g. "max-w-2xl", "max-w-4xl"
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

    useEffect(() => {
        if (!isOpen) return;

        previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

        if (lockScroll) lockBodyScroll();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
                return;
            }

            // Basic focus trap on Tab
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

        // Focus the first focusable element in the panel (or the panel itself)
        const focusTimer = window.setTimeout(() => {
            const panel = panelRef.current;
            if (!panel) return;

            const focusables = getFocusableElements(panel);
            if (focusables.length > 0) focusables[0].focus();
            else panel.focus();
        }, 0);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleKeyDown);

            if (lockScroll) unlockBodyScroll();

            // Restore focus
            previouslyFocusedRef.current?.focus?.();
            previouslyFocusedRef.current = null;
        };
    }, [isOpen, lockScroll, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Scrollable overlay */}
            <div className="fixed inset-0 overflow-y-auto">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-slate-900/40"
                    onMouseDown={(e) => {
                        if (!closeOnOverlayClick) return;
                        // only close if clicking the backdrop itself
                        if (e.target === e.currentTarget) onClose();
                    }}
                />

                {/* Container */}
                <div className="relative flex min-h-full items-start justify-center p-4 sm:p-6">
                    {/* Panel */}
                    <div
                        ref={panelRef}
                        tabIndex={-1}
                        className={[
                            "relative w-full rounded-lg border border-slate-200 bg-white shadow-xl outline-none",
                            maxWidthClassName,
                            // keep panel within viewport; make internal body scroll
                            "max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden",
                        ].join(" ")}
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
                            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-5 py-4">
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