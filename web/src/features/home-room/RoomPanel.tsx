import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

interface RoomPanelProps {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isWide = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 900px)').matches;

/**
 * Contextual panel over the room: bottom sheet on phones, compact right-hand
 * panel on desktop. Mounted only while open; the parent owns which one is active.
 */
export function RoomPanel({ title, eyebrow, onClose, children }: RoomPanelProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLElement>('[data-room-panel-close]')?.focus();
    return () => {
      const target = returnFocusRef.current;
      if (target && target.isConnected) target.focus();
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      closeRef.current();
      return;
    }
    if (e.key !== 'Tab' || isWide()) return;
    const nodes = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <div className="room-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="room-panel"
        role="dialog"
        aria-modal={isWide() ? undefined : true}
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <span className="room-panel-grabber" aria-hidden="true" />
        <header className="room-panel-header">
          <div>
            {eyebrow ? <p className="room-panel-eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId} className="room-panel-title">
              {title}
            </h2>
          </div>
          <button type="button" className="room-panel-close" data-room-panel-close onClick={onClose} aria-label={`Close ${title}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="room-panel-body">{children}</div>
        <svg className="room-panel-sprig" viewBox="0 0 80 80" aria-hidden="true">
          <path d="M8 76C8 44 26 22 62 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M18 56c-9-2-12-9-11-15 8 0 13 5 11 15zM26 42c-8-3-10-11-8-17 8 2 12 8 8 17zM40 30c-6-5-6-12-3-17 7 3 9 10 3 17zM52 20c-3-7 0-13 5-16 3 6 1 12-5 16z" fill="currentColor" opacity=".55" />
        </svg>
      </div>
    </>
  );
}
