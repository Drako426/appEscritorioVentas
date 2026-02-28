import BaseModal from "./BaseModal"

export default function ConfirmDialogModal({
  title = "Confirmar",
  message = "Estas seguro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onClose
}) {
  return (
    <BaseModal onClose={onClose}>
      <div className="bg-white w-full max-w-sm p-5 rounded shadow-lg mx-auto">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm?.()
              onClose?.()
            }}
            className="px-3 py-2 bg-blue-600 text-white rounded"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
