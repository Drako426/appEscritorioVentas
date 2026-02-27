import { useEffect, useState, useCallback } from "react"
import { getInformeGeneral } from "../services/informes.service"
import { eventBus } from "@/utils/eventBus"
import { EVENTS } from "@/utils/events"

export default function Informes() {

  const [data, setData] = useState(null)

  const hoy = new Date().toISOString().split("T")[0]

    
  // ==========================
  // REFRESCAR MANUAL
  // ==========================
  const refrescar = useCallback(async () => {
  setData(null)
  const res = await getInformeGeneral(hoy, hoy)
  setData(res)
}, [hoy])

  // ==========================
  // CARGA AUTOMÁTICA
  // ==========================
  useEffect(() => {
    const cargarInforme = async () => {
      const res = await getInformeGeneral(hoy, hoy)
      setData(res)
    }

    cargarInforme()
  }, [hoy])

  // ==========================
    // ESCUCHAR NUEVAS VENTAS
    // ==========================
    useEffect(() => {

        const actualizar = () => {
            refrescar()
        }

         eventBus.on(EVENTS.VENTA_REGISTRADA, actualizar)

        return () => {
            eventBus.off(EVENTS.VENTA_REGISTRADA, actualizar)
        }

    }, [refrescar])

  // ==========================
  // LOADING (Skeleton)
  // ==========================
  if (!data)
    return (
      <div className="p-6 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-40 mb-6"></div>

        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-300 rounded"></div>
          <div className="h-24 bg-gray-300 rounded"></div>
          <div className="h-24 bg-gray-300 rounded"></div>
        </div>
      </div>
    )

  // ==========================
  // UI
  // ==========================
  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Informes
        </h1>

        <button
          onClick={refrescar}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Actualizar
        </button>
      </div>

      {/* RESUMEN */}
      <div className="grid grid-cols-3 gap-4 mb-8">

        <div className="p-4 bg-white shadow rounded">
          <h3>Ventas</h3>
          <p className="text-xl font-bold">
            ${Number(data.resumen.total_ventas).toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white shadow rounded">
          <h3>Efectivo</h3>
          <p className="text-xl font-bold">
            ${Number(data.resumen.total_efectivo).toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-white shadow rounded">
          <h3>Transferencia</h3>
          <p className="text-xl font-bold">
            ${Number(data.resumen.total_transferencia).toLocaleString()}
          </p>
        </div>

      </div>

      {/* PRODUCTOS */}
      <h2 className="text-xl font-semibold mb-3">
        Productos más vendidos
      </h2>

      <table className="w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th>Producto</th>
            <th>Talla</th>
            <th>Cantidad</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {data.productos.map((p, i) => (
            <tr key={i} className="text-center border-t">
              <td>{p.nombre_producto}</td>
              <td>{p.talla}</td>
              <td>{p.total_vendidos}</td>
              <td>
                ${Number(p.total_dinero).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}
