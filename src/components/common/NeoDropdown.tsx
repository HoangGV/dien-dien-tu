import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { NeoButton } from './NeoButton';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  isHeader?: boolean;
  grade?: string;
  onClick?: () => void;
}

export interface NeoDropdownProps {
  label: string;
  icon?: React.ReactNode;
  items: DropdownItem[];
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  align?: 'left' | 'right';
}

export const NeoDropdown: React.FC<NeoDropdownProps> = ({
  label,
  icon,
  items,
  variant = 'secondary',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const alignClass = align === 'right' ? 'right-0 left-auto' : 'left-0 right-auto';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <NeoButton
        variant={variant}
        onClick={() => setIsOpen(!isOpen)}
        icon={icon}
        className="!h-[26px] !px-2"
      >
        <span className="leading-none text-[12px]">{label}</span>
        <ChevronDown size={11} strokeWidth={3} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </NeoButton>

      {isOpen && (
        <div className={`absolute top-[calc(100%+4px)] ${alignClass} min-w-[260px] max-w-[90vw] max-h-[85vh] overflow-y-auto bg-white border-2 border-black shadow-[3px_3px_0_#000] z-50 py-1 flex flex-col`}>
          {items.map((item) => {
            if (item.isHeader) {
              return (
                <div
                  key={item.id}
                  className="px-3 py-1 text-[11px] font-black uppercase text-[#4169E1] bg-[#EEF2FF] border-b border-t border-black first:border-t-0 select-none tracking-wide"
                >
                  {item.label}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  setIsOpen(false);
                  item.onClick?.();
                }}
                className={`w-full min-h-[30px] px-3 py-1 text-left font-bold text-xs flex items-center justify-between gap-2 border-b last:border-b-0 border-gray-100 transition-colors ${
                  item.active
                    ? 'bg-[#4169E1] text-white hover:bg-[#2F4FC0]'
                    : 'text-black hover:bg-[#F3F4F6]'
                } ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.grade && (
                  <span className="ml-2 text-[10px] font-black bg-[#FFD84D] text-black px-1.5 py-0.2 border border-black shrink-0 rounded-none">
                    {item.grade}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
