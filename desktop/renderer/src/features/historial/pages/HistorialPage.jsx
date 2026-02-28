import { useEffect, useState } from "react"
import { useModal } from "@/app/ModalProvider"
import { getHistorialCierres } from "../services/historial.service"
import HistorialTable from "../components/HistorialTable"

export default function HistorialPage() {

  const [cierres, setCierres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { openModal } = useModal()

  const fetchHistorial = async () => {
    try {
      setLoading(true)
      const data = await getHistorialCierres()
      setCierres(data)
    } catch (err) {
      setError("Error cargando historial")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

    const handleVerDetalle = (id) => {
    openModal("detalleCierre", { cierreId: id })
  }

  useEffect(() => {
    fetchHistorial()
  }, [])

  if (loading) return <p>Cargando historial...</p>

  if (error)
    return <p style={{ color: "red" }}>{error}</p>

  return (
    <div>
      <h2>Historial de Cierres</h2>

      <HistorialTable
        cierres={cierres}
        onVerDetalle={handleVerDetalle}
      />
    </div>
  )
}
