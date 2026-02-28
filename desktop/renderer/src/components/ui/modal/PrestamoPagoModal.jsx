import { useMemo, useState } from "react"
import BaseModal from "./BaseModal"

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-CO")
}

export default function PrestamoPagoModal({
  prestamoId,
  total = 0,
  initialEfectivo = "",
  initialTransferencia = "",
  onConfirm,
  onClose
}) {
  const [efectivoPago, setEfectivoPago] = useState(initialEfectivo)
  const [transferenciaPago, setTransferenciaPago] = useState(initialTransferencia)
  const [submitting, setSubmitting] = useState(false)

  const devolver = useMemo(() => {
    const pagoTotal = (Number(efectivoPago) || 0) + (Number(transferenciaPago) || 0)
    return pagoTotal - (Number(total) || 0)
  }, [efectivoPago, transferenciaPago, total])

  return (
    <BaseModal onClose={onClose} closeOnOverlay={!submitting}>
      <div className="bg-white w-full max-w-md p-6 rounded shadow-lg mx-auto">
        <h3 className="text-lg font-semibold mb-3">Pagar prestamo #{prestamoId}</h3>

        <div className="mb-3">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold">${formatMoney(total)}</div>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Efectivo</label>
          <input
            type="number"
            min="0"
            value={efectivoPago}
            onChange={(e) => setEfectivoPago(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Transferencia</label>
          <input
            type="number"
            min="0"
            value={transferenciaPago}
            onChange={(e) => setTransferenciaPago(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-5">
          <div className="text-sm text-gray-600">Devolver</div>
          <div className="text-xl font-semibold">${formatMoney(devolver)}</div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 border rounded"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
            onClick={async () => {
              try {
                setSubmitting(true)
                const ok = await onConfirm?.({
                  efectivo: Number(efectivoPago) || 0,
                  transferencia: Number(transferenciaPago) || 0
                })
                if (ok) onClose?.()
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting}
          >
            {submitting ? "Confirmando..." : "Confirmar pago"}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
