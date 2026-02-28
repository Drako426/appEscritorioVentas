import { useEffect, useRef, useState } from "react"
// eslint-disable-next-line no-unused-vars
import { NavLink } from "react-router-dom"
import { useAuth } from "@/auth/useAuth"
// eslint-disable-next-line no-unused-vars
import ConnectionStatus from "../ui/ConnectionStatus"
import { verifyPassword } from "@/auth/auth.service"
import { useCaja } from "@/context/useCaja"
import { useModal } from "@/app/ModalProvider"

export default function Header() {
  const { user, logout } = useAuth()
  const { cajaAbierta, abrirCaja, cerrarCaja } = useCaja()
  const { openModal } = useModal()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const showToast = (type, message, duration = 2600) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    setToast({ type, message })

    if (duration > 0) {
      toastTimerRef.current = setTimeout(() => {
        setToast(null)
      }, duration)
    }
  }

  const confirmarCambioCaja = async (password) => {
    const currentPassword = String(password ?? "").trim()
    if (!currentPassword) {
      showToast("error", "Debes ingresar tu contrasena")
      return false
    }

    try {
      setLoading(true)
      showToast("info", "Validando contrasena...", 0)
      await verifyPassword(currentPassword)

      if (cajaAbierta) {
        await cerrarCaja()
        showToast("success", "Caja cerrada correctamente")
      } else {
        await abrirCaja()
        showToast("success", "Caja abierta correctamente")
      }
      return true
    } catch (err) {
      showToast("error", err?.message || "Error validando contrasena")
      return false
    } finally {
      setLoading(false)
    }
  }

  const openPasswordAlert = () => {
    if (loading) return
    openModal("confirmPassword", {
      actionLabel: cajaAbierta ? "cerrar caja" : "abrir caja",
      onConfirm: confirmarCambioCaja
    })
  }

  const base = `/${user?.role || "vendedor"}`
  const tabs = [
    ...(user?.role === "admin"
      ? [
          { to: base, label: "Dashboard", end: true },
          { to: `${base}/informes`, label: "Informes" }
        ]
      : []),
    { to: `${base}/venta`, label: "Nueva Venta" },
    { to: `${base}/prestamos`, label: "Prestamos" },
    { to: `${base}/ventas`, label: "Historial" },
    { to: `${base}/inventario`, label: "Inventario" },
    { to: `${base}/cierre`, label: "Cierre" }
  ]

  return (
    <>
      <header className="bg-gray-100 border-b shadow-sm">
        <div className="px-4 pt-2">
          <div className="flex items-end gap-1 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `shrink-0 px-4 py-2 rounded-t-xl border text-sm transition-colors ${
                    isActive
                      ? "bg-white border-b-white text-gray-900 font-semibold shadow-sm"
                      : "bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="bg-white px-6 py-3 flex justify-between items-center">
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
              onClick={openPasswordAlert}
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
        </div>
      </header>

      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <div
            className={`min-w-[260px] max-w-sm rounded-lg px-4 py-3 shadow-lg text-sm font-medium border ${
              toast.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : toast.type === "error"
                  ? "bg-red-50 text-red-800 border-red-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </>
  )
}
