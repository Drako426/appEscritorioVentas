import { useMemo, useState } from "react"
import BaseModal from "./BaseModal"

export default function VentaPagoModal({
  totalGeneral = 0,
  initialEfectivo = "",
  initialTransferencia = "",
  onClose,
  onConfirm
}) {
  const [efectivoPago, setEfectivoPago] = useState(initialEfectivo)
  const [transferenciaPago, setTransferenciaPago] = useState(initialTransferencia)
  const [submitting, setSubmitting] = useState(false)

  const devolver = useMemo(() => {
    const totalPagado = (Number(efectivoPago) || 0) + (Number(transferenciaPago) || 0)
    return totalPagado - (Number(totalGeneral) || 0)
  }, [efectivoPago, transferenciaPago, totalGeneral])

  return (
    <BaseModal onClose={onClose} closeOnOverlay={!submitting}>
      <div className="bg-white w-full max-w-md p-6 rounded shadow-lg mx-auto">
        <h3 className="text-xl font-bold mb-4">Confirmar pago</h3>

        <div className="mb-3">
          <div className="text-sm text-gray-600">Total compra</div>
          <div className="text-2xl font-bold">${totalGeneral.toLocaleString()}</div>
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Efectivo</label>
          <input
            type="number"
            min="0"
            value={efectivoPago}
            onChange={(event) => setEfectivoPago(event.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Transferencia</label>
          <input
            type="number"
            min="0"
            value={transferenciaPago}
            onChange={(event) => setTransferenciaPago(event.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mb-5">
          <div className="text-sm text-gray-600">Devolver</div>
          <div className="text-xl font-semibold">${devolver.toLocaleString()}</div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            onClick={async () => {
              try {
                setSubmitting(true)
                await onConfirm?.({
                  efectivo: Number(efectivoPago) || 0,
                  transferencia: Number(transferenciaPago) || 0
                })
              } finally {
                setSubmitting(false)
              }
            }}
            disabled={submitting}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {submitting ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </BaseModal>
  )
}
