import { useState } from "react"
import BaseModal from "./BaseModal"

export default function ConfirmPasswordModal({
  actionLabel = "continuar",
  onConfirm,
  onClose
}) {
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  return (
    <BaseModal onClose={onClose} closeOnOverlay={!submitting}>
      <div className="w-full max-w-sm rounded-xl border bg-white p-5 shadow-xl mx-auto">
        <h3 className="text-base font-semibold">Confirmar contrasena</h3>
        <p className="mt-1 text-sm text-gray-600">
          Ingresa tu contrasena para {actionLabel}.
        </p>

        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void (async () => {
                if (!String(password).trim()) return
                try {
                  setSubmitting(true)
                  const ok = await onConfirm?.(String(password).trim())
                  if (ok) onClose?.()
                } finally {
                  setSubmitting(false)
                }
              })()
            }
          }}
          className="mt-3 w-full border rounded-lg px-3 py-2"
          placeholder="Contrasena"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-2 border rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (!String(password).trim()) return
              try {
                setSubmitting(true)
                const ok = await onConfirm?.(String(password).trim())
                if (ok) onClose?.()
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-60"
          >
            {submitting ? "Validando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
