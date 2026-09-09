import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SleekSpinner from './SleekSpinner';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  confirmVariant?: 'danger' | 'warning' | 'info';
  variant?: 'danger' | 'warning' | 'info';
  theme?: 'dark' | 'light';
  isLoading?: boolean;
  lang?: 'en' | 'ar' | 'fr' | string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type,
  confirmVariant,
  variant,
  theme = 'dark',
  isLoading = false,
  lang = 'en'
}) => {
  const handleClose = onClose || onCancel || (() => {});
  const modalType = type || confirmVariant || variant || 'danger';
  const isAr = lang === 'ar';
  const isFr = lang === 'fr';
  const defaultTitle = isAr ? 'تأكيد الحذف' : (isFr ? 'Confirmer la suppression' : 'Confirm Deletion');
  const defaultMessage = isAr
    ? 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.'
    : (isFr ? 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.' : 'Are you sure you want to delete this item? This action cannot be undone.');
  const defaultConfirmText = isAr ? 'حذف الآن' : (isFr ? 'Supprimer' : 'Delete Now');
  const defaultCancelText = isAr ? 'إلغاء' : (isFr ? 'Annuler' : 'Cancel');

  const modalTitle = title || defaultTitle;
  const modalMessage = message || defaultMessage;
  const modalConfirmText = confirmText || defaultConfirmText;
  const modalCancelText = cancelText || defaultCancelText;
  useEffect(() => {
    if (!isOpen) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
      confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/25',
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25',
    }
  }[modalType || 'danger'] || {
    icon: Trash2,
    iconBg: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25',
  };

  const IconComponent = typeConfig.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/85"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={`relative w-full max-w-md my-auto max-h-[90vh] overflow-y-auto dark-scrollbar rounded-2xl sm:rounded-3xl border shadow-2xl p-5 sm:p-6 z-10 ${
            isDark
              ? 'bg-stone-900 border-stone-800 text-stone-100 shadow-black'
              : 'bg-white border-stone-200 text-stone-900 shadow-stone-900/20'
          }`}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={handleClose}
            className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer z-20 ${
              isDark
                ? 'text-stone-400 hover:text-white bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 shadow-sm'
                : 'text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 shadow-sm'
            }`}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div
            dir={isAr ? 'rtl' : 'ltr'}
            className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center ${isAr ? 'sm:text-right' : 'sm:text-left'} ${isAr ? 'pl-8' : 'pr-8'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${typeConfig.iconBg}`}>
              <IconComponent className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {modalTitle}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
                {modalMessage}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-stone-800/60 dark:border-stone-800/80">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleClose}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isDark
                  ? 'bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700/60'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200'
              }`}
            >
              {modalCancelText}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                onConfirm();
                handleClose();
              }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${typeConfig.confirmBtn}`}
            >
              {isLoading ? (
                <SleekSpinner size="xs" variant="white" />
              ) : (
                <>
                  <IconComponent className="w-4 h-4" />
                  <span>{modalConfirmText}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
