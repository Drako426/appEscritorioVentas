import { useState } from "react"
import { useAuth } from "@/auth/useAuth"
import ConnectionStatus from "@/components/ui/ConnectionStatus"
import { verifyPassword } from "@/auth/auth.service"
import { useCaja } from "@/context/useCaja"

export default function Header() {
  const { user, logout } = useAuth()
  const { cajaAbierta, abrirCaja, cerrarCaja } = useCaja()
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")

  const openPasswordModal = () => {
    if (loading) return
    setPassword("")
    setShowPasswordModal(true)
  }

  const closePasswordModal = () => {
    if (loading) return
    setShowPasswordModal(false)
    setPassword("")
  }

  const confirmarCambioCaja = async () => {
    if (!password.trim()) {
      alert("Debes ingresar tu contrasena")
      return
    }

    try {
      setLoading(true)
      await verifyPassword(password.trim())

      if (cajaAbierta) {
        await cerrarCaja()
      } else {
        await abrirCaja()
      }

      setShowPasswordModal(false)
      setPassword("")
    } catch (err) {
      alert(err?.message || "Error validando contrasena")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="bg-white shadow px-6 py-3 flex justify-between items-center">
        <h1 className="font-bold text-lg">Tienda Calzado</h1>

        <div className="flex items-center gap-4">
          <ConnectionStatus />

          <div
            className={`text-sm font-semibold px-3 py-1 rounded-full ${
              cajaAbierta
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {cajaAbierta ? "Caja abierta" : "Caja cerrada"}
          </div>

          <button
            onClick={openPasswordModal}
            disabled={loading}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            {loading ? "..." : cajaAbierta ? "Cerrar caja" : "Abrir caja"}
          </button>

          <span className="text-sm text-gray-600">
            {user?.usuario} ({user?.role})
          </span>

          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            Salir
          </button>
        </div>
      </header>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-3">Confirmar contrasena</h3>
            <p className="text-sm text-gray-600 mb-3">
              Ingresa tu contrasena para {cajaAbierta ? "cerrar" : "abrir"} caja.
            </p>

            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void confirmarCambioCaja()
                }
              }}
              className="w-full border p-2 rounded mb-4"
              placeholder="Contrasena"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closePasswordModal}
                disabled={loading}
                className="px-3 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={() => void confirmarCambioCaja()}
                disabled={loading}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                {loading ? "Validando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
