import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  theme?: 'light' | 'dark';
  delay?: number;
}

export function Tooltip({ children, content, theme = 'light', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.top - 8,
          left: rect.left + rect.width / 2,
        });
      }
      setVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-slate-200' : 'text-slate-700';
  const borderColor = isDark ? 'border-slate-600' : 'border-slate-200';

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="contents"
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            className={`fixed z-[9999] pointer-events-none -translate-x-1/2 -translate-y-full mb-2 px-3 py-2 rounded-lg shadow-lg border text-xs max-w-[250px] ${bgColor} ${textColor} ${borderColor}`}
            style={{ top: position.top, left: position.left }}
          >
            {content}
            <div
              className={`absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${
                isDark ? 'border-t-slate-800' : 'border-t-white'
              }`}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
