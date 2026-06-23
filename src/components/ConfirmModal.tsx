interface ConfirmModalProps {
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirm', loading }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-5">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <div className="text-gray-600 text-base leading-relaxed">{message}</div>
        <div className="space-y-3">
          <button onClick={onConfirm} disabled={loading} className="btn-primary">
            {loading ? 'Please wait...' : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={loading} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  );
}
