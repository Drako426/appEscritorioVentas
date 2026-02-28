import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getInventario } from "@/features/inventario/services/inventario.service"
import { eventBus } from "@/utils/eventBus"
import { EVENTS } from "@/utils/events"
import { buscarClientePorCedula } from "@/services/clientes.service"
import { useModal } from "@/app/ModalProvider"
import { useCaja } from "@/context/useCaja"
import {
  crearPrestamo,
  devolverPrestamo,
  getDetallePrestamo,
  getPrestamosActivos,
  pagarPrestamo
} from "../services/prestamos.service"

function formatMoney(value) {
  return Number(value || 0).toLocaleString("es-CO")
}

function toNumber(value) {
  return Number(value || 0)
}

export default function PrestamoPage() {
  const [inventario, setInventario] = useState([])
  const [prestamos, setPrestamos] = useState([])
  const [detalle, setDetalle] = useState(null)

  const [buscar, setBuscar] = useState("")
  const [loadingPrestamos, setLoadingPrestamos] = useState(false)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [saving, setSaving] = useState(false)

  const [cedula, setCedula] = useState("")
  const [nombreCliente, setNombreCliente] = useState("")

  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")
  const [talla, setTalla] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [precio, setPrecio] = useState("")
  const [items, setItems] = useState([])

  const [alerta, setAlerta] = useState("")
  const { openModal } = useModal()
  const { cajaAbierta, loadingCaja } = useCaja()
  const codigoRef = useRef()
  const tallaRef = useRef()
  const cantidadRef = useRef()
  const precioRef = useRef()
  const cedulaRef = useRef()
  const nombreClienteRef = useRef()

  const mostrarAlerta = useCallback((msg) => {
    setAlerta(msg)
    setTimeout(() => setAlerta(""), 3500)
  }, [])

  const cargarInventario = useCallback(async () => {
    try {
      const data = await getInventario()
      setInventario(data || [])
    } catch (error) {
      console.error(error)
      setInventario([])
    }
  }, [])

  const cargarPrestamos = useCallback(async (term = "") => {
    try {
      setLoadingPrestamos(true)
      const data = await getPrestamosActivos(term)
      setPrestamos(data)
    } catch (error) {
      console.error(error)
      mostrarAlerta(error?.message || "No se pudieron cargar prestamos")
    } finally {
      setLoadingPrestamos(false)
    }
  }, [mostrarAlerta])

  useEffect(() => {
    void cargarInventario()
    void cargarPrestamos("")
  }, [cargarInventario, cargarPrestamos])

  const buscarItemInventario = (codigoValue, tallaValue = null) => {
    const normalized = String(codigoValue ?? "").trim()
    return inventario.find((p) => {
      if (String(p.codigo ?? "").trim() !== normalized) return false
      if (tallaValue == null) return true
      return String(p.talla) === String(tallaValue)
    })
  }

  const totalPrestamo = useMemo(
    () => items.reduce((acc, item) => acc + toNumber(item.total), 0),
    [items]
  )

  const onCedulaBlur = async () => {
    const value = String(cedula).trim()
    if (!value) return

    try {
      const cliente = await buscarClientePorCedula(value)
      if (cliente?.nombre) {
        setNombreCliente(cliente.nombre)
      } else {
        setNombreCliente("")
      }
    } catch (error) {
      console.error(error)
      mostrarAlerta(error?.message || "Error buscando cliente")
    }
  }

  const onCedulaEnter = async () => {
    await onCedulaBlur()
    nombreClienteRef.current?.focus()
  }

  const onCodigoEnter = () => {
    const item = buscarItemInventario(codigo)
    if (!item) {
      mostrarAlerta("Codigo no encontrado")
      return
    }
    setNombre(item.nombre)
    tallaRef.current?.focus()
  }

  const onTallaEnter = () => {
    const item = buscarItemInventario(codigo, talla)
    if (!item) {
      mostrarAlerta("Producto/talla no existe")
      return
    }

    if (toNumber(item.stock_actual) <= 0) {
      mostrarAlerta("Este producto no tiene stock")
      return
    }

    cantidadRef.current?.focus()
  }

  const onCantidadEnter = () => {
    const item = buscarItemInventario(codigo, talla)
    if (!item) {
      mostrarAlerta("Producto/talla no existe")
      return
    }

    const cant = toNumber(cantidad)
    if (cant <= 0) {
      mostrarAlerta("Cantidad invalida")
      return
    }

    if (cant > toNumber(item.stock_actual)) {
      mostrarAlerta(`Stock insuficiente. Disponible ${item.stock_actual}`)
      return
    }

    precioRef.current?.focus()
  }

  const limpiarFormularioItem = () => {
    setCodigo("")
    setNombre("")
    setTalla("")
    setCantidad("")
    setPrecio("")
    codigoRef.current?.focus()
  }

  const agregarItem = () => {
    const item = buscarItemInventario(codigo, talla)

    if (!item) {
      mostrarAlerta("Producto/talla no existe")
      return
    }

    const cant = toNumber(cantidad)
    const val = toNumber(precio)

    if (cant <= 0 || val <= 0) {
      mostrarAlerta("Cantidad y precio deben ser mayores a 0")
      return
    }

    if (cant > toNumber(item.stock_actual)) {
      mostrarAlerta(`Stock insuficiente. Disponible ${item.stock_actual}`)
      return
    }

    setItems((prev) => [
      ...prev,
      {
        codigo: String(codigo).trim(),
        nombre: item.nombre,
        talla: String(talla).trim(),
        cantidad: cant,
        precio: val,
        total: cant * val
      }
    ])

    limpiarFormularioItem()
  }

  const registrarPrestamo = async () => {
    const ced = String(cedula).trim()
    const nom = String(nombreCliente).trim()

    if (!ced) {
      mostrarAlerta("Cedula requerida")
      return
    }

    if (!nom) {
      mostrarAlerta("Nombre requerido")
      return
    }

    if (items.length === 0) {
      mostrarAlerta("Agrega al menos un item")
      return
    }

    try {
      setSaving(true)
      await crearPrestamo({
        cedula: ced,
        nombre: nom,
        items: items.map((item) => ({
          codigo: item.codigo,
          talla: item.talla,
          cantidad: item.cantidad,
          precio: item.precio
        }))
      })

      mostrarAlerta("Prestamo creado correctamente")
      setItems([])
      await cargarInventario()
      await cargarPrestamos("")
    } catch (error) {
      console.error(error)
      mostrarAlerta(error?.message || "Error creando prestamo")
    } finally {
      setSaving(false)
    }
  }

  const seleccionarPrestamo = async (id) => {
    try {
      setLoadingDetalle(true)
      const data = await getDetallePrestamo(id)
      setDetalle(data)
    } catch (error) {
      console.error(error)
      mostrarAlerta(error?.message || "Error cargando detalle")
    } finally {
      setLoadingDetalle(false)
    }
  }

  const confirmarDevolucion = async () => {
    if (!detalle?.prestamo?.id) return
    openModal("confirmDialog", {
      title: "Confirmar devolucion",
      message: "Confirmar devolucion completa del prestamo?",
      confirmText: "Devolver",
      onConfirm: async () => {
        try {
          await devolverPrestamo(detalle.prestamo.id)
          mostrarAlerta("Prestamo devuelto correctamente")
          setDetalle(null)
          await cargarInventario()
          await cargarPrestamos("")
        } catch (error) {
          console.error(error)
          mostrarAlerta(error?.message || "Error devolviendo prestamo")
        }
      }
    })
  }

  const abrirPago = () => {
    if (!detalle?.prestamo) return
    const prestamoId = detalle.prestamo.id
    const total = toNumber(detalle.prestamo.total)

    openModal("prestamoPago", {
      prestamoId,
      total,
      initialEfectivo: String(total),
      initialTransferencia: "0",
      onConfirm: async ({ efectivo, transferencia }) => {
        const ok = await confirmarPago({
          prestamoId,
          total,
          efectivo,
          transferencia
        })
        return ok
      }
    })
  }

  const confirmarPago = async ({ prestamoId, total, efectivo = 0, transferencia = 0 }) => {
    if (!prestamoId) return false
    const pagoTotal = toNumber(efectivo) + toNumber(transferencia)
    if (pagoTotal < total) {
      mostrarAlerta("Pago insuficiente")
      return false
    }

    try {
      const data = await pagarPrestamo(prestamoId, {
        efectivo: toNumber(efectivo),
        transferencia: toNumber(transferencia)
      })

      eventBus.emit(EVENTS.VENTA_REGISTRADA, data)
      mostrarAlerta("Prestamo pagado correctamente")
      setDetalle(null)
      await cargarPrestamos("")
      return true
    } catch (error) {
      console.error(error)
      mostrarAlerta(error?.message || "Error pagando prestamo")
      return false
    }
  }

  const imprimirDetalle = () => {
    if (!detalle?.prestamo) return

    const htmlItems = (detalle.items || [])
      .map((item) => `
        <tr>
          <td>${item.codigo}</td>
          <td>${item.nombre}</td>
          <td>${item.talla}</td>
          <td>${item.cantidad}</td>
          <td>${formatMoney(item.precio)}</td>
          <td>${formatMoney(item.subtotal)}</td>
        </tr>
      `)
      .join("")

    const html = `
      <html>
        <head>
          <title>Comprobante Prestamo #${detalle.prestamo.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td, th { border: 1px solid #ddd; padding: 6px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>Prestamo #${detalle.prestamo.id}</h2>
          <div><strong>Fecha:</strong> ${new Date(detalle.prestamo.fecha_prestamo).toLocaleString("es-CO")}</div>
          <div><strong>Cedula:</strong> ${detalle.prestamo.cedula}</div>
          <div><strong>Cliente:</strong> ${detalle.prestamo.cliente_nombre}</div>
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Talla</th>
                <th>Cantidad</th>
                <th>Valor</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${htmlItems}</tbody>
          </table>
          <h3>Total: ${formatMoney(detalle.prestamo.total)}</h3>
        </body>
      </html>
    `

    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) return

    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  if (loadingCaja) {
    return <div className="p-6">Verificando sesion de caja...</div>
  }

  if (!cajaAbierta) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold">Caja cerrada</h2>
        <p className="mt-2">Debes abrir una sesion de caja antes de gestionar prestamos.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Prestamos</h1>

      {alerta && <div className="bg-red-500 text-white p-3 rounded">{alerta}</div>}

      <section className="bg-white border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Registrar prestamo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Cedula"
            ref={cedulaRef}
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            onBlur={() => void onCedulaBlur()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                void onCedulaEnter()
              }
            }}
          />
          <input
            className="border p-2 rounded"
            placeholder="Nombre cliente"
            ref={nombreClienteRef}
            value={nombreCliente}
            onChange={(e) => setNombreCliente(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                codigoRef.current?.focus()
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <input
            className="border p-2 rounded"
            placeholder="Codigo"
            ref={codigoRef}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCodigoEnter()
            }}
          />
          <input
            className="border p-2 rounded bg-gray-100"
            value={nombre}
            readOnly
            placeholder="Nombre"
            onKeyDown={(e) => {
              if (e.key === "Enter") tallaRef.current?.focus()
            }}
          />
          <input
            className="border p-2 rounded"
            placeholder="Talla"
            ref={tallaRef}
            value={talla}
            onChange={(e) => setTalla(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onTallaEnter()
            }}
          />
          <input
            className="border p-2 rounded"
            placeholder="Cantidad"
            type="number"
            ref={cantidadRef}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCantidadEnter()
            }}
            disabled={!talla}
          />
          <input
            className="border p-2 rounded"
            placeholder="Precio"
            type="number"
            ref={precioRef}
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") agregarItem()
            }}
          />
        </div>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Talla</th>
              <th>Cantidad</th>
              <th>Valor</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.codigo}-${item.talla}-${index}`} className="text-center border-t">
                <td>{item.codigo}</td>
                <td>{item.nombre}</td>
                <td>{item.talla}</td>
                <td>{item.cantidad}</td>
                <td>${formatMoney(item.precio)}</td>
                <td>${formatMoney(item.total)}</td>
                <td>
                  <button
                    className="text-red-600"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-2 text-gray-500">
                  Sin items
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center">
          <div className="font-bold">Total: ${formatMoney(totalPrestamo)}</div>
          <button
            onClick={() => void registrarPrestamo()}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar prestamo"}
          </button>
        </div>
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Prestamos activos</h2>
        <div className="flex gap-2">
          <input
            className="border p-2 rounded w-full"
            placeholder="Buscar por cedula o nombre"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void cargarPrestamos(buscar)
            }}
          />
          <button
            className="bg-gray-700 text-white px-4 rounded"
            onClick={() => void cargarPrestamos(buscar)}
          >
            Buscar
          </button>
        </div>

        {loadingPrestamos ? (
          <p>Cargando prestamos...</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cedula</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {prestamos.map((prestamo) => (
                <tr
                  key={prestamo.id}
                  className="border-t text-center cursor-pointer hover:bg-gray-50"
                  onClick={() => void seleccionarPrestamo(prestamo.id)}
                >
                  <td>{prestamo.id}</td>
                  <td>{new Date(prestamo.fecha_prestamo).toLocaleString("es-CO")}</td>
                  <td>{prestamo.cedula}</td>
                  <td>{prestamo.cliente_nombre}</td>
                  <td>{prestamo.total_items}</td>
                  <td>${formatMoney(prestamo.total)}</td>
                </tr>
              ))}
              {prestamos.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-2 text-gray-500">
                    No hay prestamos activos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <section className="bg-white border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Detalle del prestamo</h2>
        {loadingDetalle && <p>Cargando detalle...</p>}
        {!loadingDetalle && !detalle && (
          <p className="text-gray-500">Selecciona un prestamo activo para ver detalles.</p>
        )}

        {!loadingDetalle && detalle?.prestamo && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div><strong>ID:</strong> {detalle.prestamo.id}</div>
              <div><strong>Fecha:</strong> {new Date(detalle.prestamo.fecha_prestamo).toLocaleString("es-CO")}</div>
              <div><strong>Cedula:</strong> {detalle.prestamo.cedula}</div>
              <div><strong>Cliente:</strong> {detalle.prestamo.cliente_nombre}</div>
            </div>

            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th>Codigo</th>
                  <th>Nombre</th>
                  <th>Talla</th>
                  <th>Cantidad</th>
                  <th>Valor</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.items.map((item) => (
                  <tr key={item.id} className="border-t text-center">
                    <td>{item.codigo}</td>
                    <td>{item.nombre}</td>
                    <td>{item.talla}</td>
                    <td>{item.cantidad}</td>
                    <td>${formatMoney(item.precio)}</td>
                    <td>${formatMoney(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="font-bold">Total: ${formatMoney(detalle.prestamo.total)}</div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border rounded" onClick={imprimirDetalle}>
                  Imprimir
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={abrirPago}>
                  Pagar
                </button>
                <button className="px-4 py-2 bg-amber-600 text-white rounded" onClick={() => void confirmarDevolucion()}>
                  Devolver
                </button>
              </div>
            </div>
          </>
        )}
      </section>

    </div>
  )
}
