import { useEffect, useState } from "react"
import BaseModal from "./BaseModal"
import { getDetalleCierre } from "@/features/historial/services/historial.service"

export default function HistorialDetalleCierreModal({ cierreId, onClose }) {
  const [ventas, setVentas] = useState([])
  const [cierre, setCierre] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!cierreId) return

    const fetchDetalle = async () => {
      try {
        setLoading(true)
        const data = await getDetalleCierre(cierreId)
        setCierre(data.cierre)
        setVentas(data.ventas)
      } catch (error) {
        console.error("Error cargando detalle:", error)
      } finally {
        setLoading(false)
      }
    }

    void fetchDetalle()
  }, [cierreId])

  if (!cierreId) return null

  return (
    <BaseModal onClose={onClose}>
      <div style={modalStyle}>
        <h3>Detalle del Cierre</h3>

        <button onClick={onClose} style={{ marginBottom: "10px" }}>
          Cerrar
        </button>

        {loading && <p>Cargando...</p>}

        {!loading && cierre && (
          <>
            <p>
              <strong>Fecha cierre:</strong>{" "}
              {new Date(cierre.fecha_cierre).toLocaleString("es-CO")}
            </p>

            <hr />

            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Talla</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                </tr>
              </thead>

              <tbody>
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan="5">No hay ventas en este cierre</td>
                  </tr>
                ) : (
                  ventas.map((item, index) => (
                    <tr key={index}>
                      <td>{new Date(item.fecha).toLocaleString("es-CO")}</td>
                      <td>{item.nombre_producto}</td>
                      <td>{item.talla}</td>
                      <td>{item.cantidad}</td>
                      <td>
                        {Number(item.precio).toLocaleString("es-CO", {
                          style: "currency",
                          currency: "COP",
                          minimumFractionDigits: 0
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </BaseModal>
  )
}

const modalStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "8px",
  width: "700px",
  maxHeight: "80vh",
  overflowY: "auto",
  boxShadow: "0 5px 20px rgba(0,0,0,0.2)"
}

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px"
}
