import { useMemo, useState } from "react"
import BaseModal from "./BaseModal"

export default function VentaBuscadorModal({ inventario = [], onSelect, onClose }) {
  const [busqueda, setBusqueda] = useState("")
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0)

  const resultados = useMemo(
    () =>
      (inventario || []).filter(
        (p) =>
          String(p.nombre ?? "")
            .toLowerCase()
            .includes(busqueda.toLowerCase()) || String(p.codigo ?? "").includes(busqueda)
      ),
    [inventario, busqueda]
  )

  const seleccionarIndice = (index) => {
    const seleccionado = resultados[index]
    if (!seleccionado) return
    onSelect?.(seleccionado)
    onClose?.()
  }

  return (
    <BaseModal onClose={onClose}>
      <div className="bg-white w-2/3 p-6 rounded shadow-lg mx-auto">
        <input
          autoFocus
          value={busqueda}
          onChange={(event) => {
            setBusqueda(event.target.value)
            setIndiceSeleccionado(0)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              setIndiceSeleccionado((prev) => (prev < resultados.length - 1 ? prev + 1 : prev))
            }

            if (event.key === "ArrowUp") {
              setIndiceSeleccionado((prev) => (prev > 0 ? prev - 1 : prev))
            }

            if (event.key === "Enter") {
              event.preventDefault()
              seleccionarIndice(indiceSeleccionado)
            }
          }}
          placeholder="Buscar producto..."
          className="w-full border p-2 mb-4 rounded"
        />

        <div className="max-h-80 overflow-y-auto">
          {resultados.map((item, index) => (
            <div
              key={`${item.codigo}-${item.talla}-${index}`}
              className={`p-2 cursor-pointer ${index === indiceSeleccionado ? "bg-blue-200" : ""}`}
              onMouseEnter={() => setIndiceSeleccionado(index)}
              onClick={() => seleccionarIndice(index)}
            >
              <div className="flex justify-between">
                <span>{item.nombre}</span>
                <span>Talla: {item.talla}</span>
                <span>Stock: {item.stock_actual}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  )
}
