import { Archive, Trash2 } from 'lucide-react'
import Modal from './Modal.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Excluir definitivamente',
  onConfirm,
  archiveLabel,
  onArchive,
  busy = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} subtitle="Confirme antes de continuar" size="max-w-lg">
      <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">
        {description}
      </p>
      <div className="modal-actions mt-5">
        <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
        {onArchive && (
          <button type="button" className="action-button action-warning min-h-11 px-4" onClick={onArchive} disabled={busy}>
            <Archive size={17} />
            {archiveLabel || 'Arquivar'}
          </button>
        )}
        <button type="button" className="danger-button" onClick={onConfirm} disabled={busy}>
          <Trash2 size={17} />
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
