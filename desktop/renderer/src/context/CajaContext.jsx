import { createContext, useEffect, useState } from "react"
import {
  obtenerSesionActiva,
  abrirSesionCaja as abrirCajaAPI,
  cerrarSesionCaja as cerrarCajaAPI
} from "../services/sesionCaja.service"
import { eventBus } from "@/utils/eventBus"
import { EVENTS } from "@/utils/events"

// eslint-disable-next-line react-refresh/only-export-components
export const CajaContext = createContext()

export function CajaProvider({ children }) {

  const [sesionCaja, setSesionCaja] = useState(null)
  const [loadingCaja, setLoadingCaja] = useState(true)

  useEffect(() => {
    cargarSesion()
  }, [])

  useEffect(() => {
    const onCajaAbierta = (sesion) => setSesionCaja(sesion || {})
    const onCajaCerrada = () => setSesionCaja(null)

    eventBus.on(EVENTS.CAJA_ABIERTA, onCajaAbierta)
    eventBus.on(EVENTS.CAJA_CERRADA, onCajaCerrada)

    return () => {
      eventBus.off(EVENTS.CAJA_ABIERTA, onCajaAbierta)
      eventBus.off(EVENTS.CAJA_CERRADA, onCajaCerrada)
    }
  }, [])

  const cargarSesion = async () => {
    const token = sessionStorage.getItem("token")

    if (!token) {
      setSesionCaja(null)
      setLoadingCaja(false)
      return
    }

    try {
      const sesion = await obtenerSesionActiva()
      setSesionCaja(sesion)
    } catch (err) {
      setSesionCaja(null)
      console.error(err)
    } finally {
      setLoadingCaja(false)
    }
  }

  const abrirCaja = async () => {
    try {
      const sesion = await abrirCajaAPI(0)
      setSesionCaja(sesion)
      return sesion
    } catch (err) {
      await cargarSesion()
      console.error(err)
      throw err
    }
  }

  const cerrarCaja = async () => {
    try {
      await cerrarCajaAPI()
      setSesionCaja(null)
      eventBus.emit(EVENTS.CAJA_CERRADA)
      return true
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  return (
    <CajaContext.Provider
      value={{
        sesionCaja,
        cajaAbierta: !!sesionCaja,
        abrirCaja,
        cerrarCaja,
        loadingCaja
      }}
    >
      {children}
    </CajaContext.Provider>
  )
}
