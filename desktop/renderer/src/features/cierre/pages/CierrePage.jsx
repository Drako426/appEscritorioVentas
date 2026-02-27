import { useState } from "react"
import { generarCierre } from "@/services/cierre.service"
import CierreForm from "@/features/cierre/components/CierreForm"
import CierreResumen from "@/features/cierre/components/CierreResumen"

export default function CierrePage() {

  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleGenerar = async () => {
    try {
      setLoading(true)

      const data = await generarCierre()

      setResultado(data.cierre)

    } catch (error) {
      console.error(error)
      alert(error?.message || "Error generando cierre")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Cierre de Caja</h2>

      <CierreForm onGenerar={handleGenerar} />

      {loading && <p>Generando cierre...</p>}

      <CierreResumen data={resultado} />
    </div>
  )
}
