import { Modal } from './Modal';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="420px">
      <p className="text-gray-500 text-[0.938rem] leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
          onClick={onClose}
          type="button"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          className={cn(
            'px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
            variant === 'danger'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-primary hover:bg-primary-hover'
          )}
          onClick={onConfirm}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
