import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { NeoButton } from './NeoButton';

export interface NeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidthClass?: string;
  footerActions?: React.ReactNode;
}

export const NeoModal: React.FC<NeoModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidthClass = 'max-w-2xl',
  footerActions,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 neo-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClass} bg-white border-[3px] border-black shadow-[6px_6px_0_#000] flex flex-col max-h-[90vh] overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#4169E1] text-white px-4 py-3 flex items-center justify-between border-b-[3px] border-black select-none">
          <h2 className="text-lg font-black tracking-wider uppercase">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white text-black border-2 border-black flex items-center justify-center hover:bg-[#FFD84D] transition-transform active:translate-y-0.5"
            aria-label="Đóng cửa sổ"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto font-medium text-black text-sm flex-1 space-y-4">
          {children}
        </div>

        {/* Modal Footer */}
        {footerActions && (
          <div className="bg-[#EEF2FF] p-4 border-t-[3px] border-black flex items-center justify-end gap-3 flex-wrap">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};
