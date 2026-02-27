import { useEffect, useRef, useState } from "react"
import { getInventario } from "@/features/inventario/services/inventario.service"
import { registrarVenta } from "@/features/ventas/services/ventas.service"
import { buscarClientePorCedula } from "@/services/clientes.service"
import { eventBus } from "@/utils/eventBus"
import { EVENTS } from "@/utils/events"
import { useCaja } from "@/context/useCaja"

export default function Ventas() {
  const [inventario, setInventario] = useState([])
  const [codigo, setCodigo] = useState("")
  const [nombre, setNombre] = useState("")
  const [talla, setTalla] = useState("")
  const [cantidad, setCantidad] = useState("")
  const [precio, setPrecio] = useState("")
  const [carrito, setCarrito] = useState([])
  const [alerta, setAlerta] = useState(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [efectivoPago, setEfectivoPago] = useState("")
  const [transferenciaPago, setTransferenciaPago] = useState("")
  const [guardandoVenta, setGuardandoVenta] = useState(false)
  const { cajaAbierta, loadingCaja } = useCaja()

  const [cedulaCliente, setCedulaCliente] = useState("")
  const [nombreCliente, setNombreCliente] = useState("")

  const [mostrarBuscador, setMostrarBuscador] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0)

  const codigoRef = useRef()
  const tallaRef = useRef()
  const cantidadRef = useRef()
  const precioRef = useRef()

  const normalizarCodigo = (value) => String(value ?? "").trim()

  const buscarItem = (codigoBuscado, tallaBuscada = null) => {
    const codigoNormalizado = normalizarCodigo(codigoBuscado)

    return inventario.find((p) => {
      const mismoCodigo = normalizarCodigo(p.codigo) === codigoNormalizado
      if (!mismoCodigo) return false

      if (tallaBuscada == null) return true
      return String(p.talla) === String(tallaBuscada)
    })
  }

  const cargarInventario = async () => {
    try {
      const data = await getInventario()
      setInventario(data || [])
    } catch (error) {
      console.error("Error cargando inventario en ventas:", error)
      setInventario([])
    }
  }

  useEffect(() => {
    void cargarInventario()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault()
        setMostrarBuscador(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const mostrarAlerta = (mensaje) => {
    setAlerta(mensaje)
    setTimeout(() => setAlerta(null), 4000)
  }

  const resultados = inventario.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      String(p.codigo).includes(busqueda)
  )

  const handleBuscadorKeys = (e) => {
    if (e.key === "ArrowDown") {
      setIndiceSeleccionado((prev) => (prev < resultados.length - 1 ? prev + 1 : prev))
    }

    if (e.key === "ArrowUp") {
      setIndiceSeleccionado((prev) => (prev > 0 ? prev - 1 : prev))
    }

    if (e.key === "Enter") {
      const seleccionado = resultados[indiceSeleccionado]
      if (!seleccionado) return

      setCodigo(String(seleccionado.codigo ?? ""))
      setNombre(seleccionado.nombre)
      setTalla(seleccionado.talla)

      setMostrarBuscador(false)
      setBusqueda("")
      codigoRef.current?.focus()
    }

    if (e.key === "Escape") {
      setMostrarBuscador(false)
    }
  }

  const onCedulaBlur = async () => {
    const cedula = String(cedulaCliente).trim()
    if (!cedula) return

    try {
      const cliente = await buscarClientePorCedula(cedula)
      if (cliente?.nombre) {
        setNombreCliente(cliente.nombre)
      }
    } catch (error) {
      console.error(error)
      mostrarAlerta(error?.message || "Error buscando cliente")
    }
  }

  const handleCodigo = (e) => {
    if (e.key !== "Enter") return

    const producto = buscarItem(codigo)
    if (!producto) {
      mostrarAlerta("El codigo no existe")
      return
    }

    setNombre(producto.nombre)
    tallaRef.current?.focus()
  }

  const handleTalla = (e) => {
    if (e.key !== "Enter") return

    const item = buscarItem(codigo, talla)
    if (!item) {
      mostrarAlerta("Esa talla no existe para este producto")
      setTalla("")
      return
    }

    if (item.stock_actual === 0) {
      mostrarAlerta("Este tenis tiene 0 stock")
      setTalla("")
      return
    }

    cantidadRef.current?.focus()
  }

  const handleCantidad = (e) => {
    if (e.key !== "Enter") return

    const item = buscarItem(codigo, talla)
    if (!item) {
      mostrarAlerta("Error interno: talla no encontrada")
      return
    }

    if (Number(cantidad) <= 0) {
      mostrarAlerta("Cantidad invalida")
      return
    }

    if (Number(cantidad) > Number(item.stock_actual)) {
      mostrarAlerta(`Stock insuficiente. Disponible: ${item.stock_actual}`)
      setCantidad("")
      return
    }

    precioRef.current?.focus()
  }

  const limpiarFormularioProducto = () => {
    setCodigo("")
    setNombre("")
    setTalla("")
    setCantidad("")
    setPrecio("")
    codigoRef.current?.focus()
  }

  const agregarProducto = () => {
    if (!precio || Number(precio) <= 0) {
      mostrarAlerta("Precio invalido")
      return
    }

    const total = Number(cantidad) * Number(precio)

    setCarrito((prev) => [
      ...prev,
      {
        codigo,
        talla,
        cantidad: Number(cantidad),
        precio: Number(precio),
        total
      }
    ])

    limpiarFormularioProducto()
  }

  const eliminarItem = (index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index))
  }

  const totalGeneral = carrito.reduce((acc, item) => acc + item.total, 0)
  const efectivoNumero = Number(efectivoPago) || 0
  const transferenciaNumero = Number(transferenciaPago) || 0
  const totalPagado = efectivoNumero + transferenciaNumero
  const devolver = Math.max(totalPagado - totalGeneral, 0)

  const abrirModalPago = () => {
    if (carrito.length === 0) {
      mostrarAlerta("No hay productos en el carrito")
      return
    }

    if (!String(cedulaCliente).trim()) {
      mostrarAlerta("La cedula del cliente es obligatoria")
      return
    }

    if (!String(nombreCliente).trim()) {
      mostrarAlerta("El nombre del cliente es obligatorio")
      return
    }

    setEfectivoPago(String(totalGeneral))
    setTransferenciaPago("0")
    setMostrarModalPago(true)
  }

  const guardarVenta = async () => {
    if (totalPagado < totalGeneral) {
      mostrarAlerta("El pago es menor al total de la compra")
      return
    }

    try {
      setGuardandoVenta(true)

      const user =
        JSON.parse(sessionStorage.getItem("user")) ||
        JSON.parse(localStorage.getItem("user"))

      if (!user || !user.id) {
        mostrarAlerta("Sesion invalida")
        return
      }

      const payload = {
        usuario_id: user.id,
        cliente_cedula: String(cedulaCliente).trim(),
        cliente_nombre: String(nombreCliente).trim(),
        items: carrito.map((item) => ({
          codigo: item.codigo,
          talla: item.talla,
          cantidad: item.cantidad,
          precio: item.precio
        })),
        efectivo: efectivoNumero,
        transferencia: transferenciaNumero
      }

      const venta = await registrarVenta(payload)
      eventBus.emit(EVENTS.VENTA_REGISTRADA)

      mostrarAlerta(
        venta?.offline
          ? "Venta guardada offline. Se sincronizara al reconectar."
          : "Venta registrada correctamente"
      )

      setCarrito([])
      setMostrarModalPago(false)
      setEfectivoPago("")
      setTransferenciaPago("")

      if (!venta?.offline) {
        await cargarInventario()
      }
    } catch (error) {
      console.error("Error backend:", error)
      mostrarAlerta(error?.message || "Error registrando venta")
    } finally {
      setGuardandoVenta(false)
    }
  }

  if (loadingCaja) {
    return <div className="p-6">Verificando sesion de caja...</div>
  }

  if (!cajaAbierta) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-bold">Caja cerrada</h2>
        <p className="mt-2">Debes abrir una sesion de caja antes de registrar ventas.</p>
      </div>
    )
  }

  return (
    <div
      className="p-6"
      onKeyDown={(e) => {
        if (e.key === "Tab") e.preventDefault()
      }}
    >
      <h1 className="text-2xl font-bold mb-4">Nueva Venta</h1>

      {alerta && <div className="bg-red-500 text-white p-3 rounded mb-4">{alerta}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <input
          value={cedulaCliente}
          onChange={(e) => setCedulaCliente(e.target.value)}
          onBlur={() => void onCedulaBlur()}
          placeholder="Cedula cliente"
          className="border p-2 rounded"
        />
        <input
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          placeholder="Nombre cliente"
          className="border p-2 rounded"
        />
      </div>

      <div className="grid grid-cols-5 gap-2 mb-6">
        <input
          ref={codigoRef}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={handleCodigo}
          placeholder="Codigo"
          className="border p-2 rounded"
        />

        <input
          value={nombre}
          readOnly
          onKeyDown={(e) => {
            if (e.key === "Enter") tallaRef.current?.focus()
          }}
          placeholder="Nombre"
          className="border p-2 rounded bg-gray-100"
        />

        <input
          ref={tallaRef}
          value={talla}
          onChange={(e) => setTalla(e.target.value)}
          onKeyDown={handleTalla}
          placeholder="Talla"
          className="border p-2 rounded"
        />

        <input
          ref={cantidadRef}
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          onKeyDown={handleCantidad}
          disabled={!talla}
          placeholder="Cantidad"
          type="number"
          className="border p-2 rounded"
        />

        <input
          ref={precioRef}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") agregarProducto()
          }}
          placeholder="Precio"
          type="number"
          className="border p-2 rounded"
        />
      </div>

      <table className="w-full text-sm border shadow">
        <thead className="bg-gray-200">
          <tr>
            <th>Codigo</th>
            <th>Talla</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {carrito.map((item, index) => (
            <tr key={index} className="border-t text-center">
              <td>{item.codigo}</td>
              <td>{item.talla}</td>
              <td>{item.cantidad}</td>
              <td>${item.precio.toLocaleString()}</td>
              <td>${item.total.toLocaleString()}</td>
              <td>
                <button onClick={() => eliminarItem(index)} className="text-red-600">
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-6">
        <div className="text-xl font-bold">Total: ${totalGeneral.toLocaleString()}</div>

        <button onClick={abrirModalPago} className="bg-green-600 text-white px-6 py-2 rounded shadow">
          Registrar Venta
        </button>
      </div>

      {mostrarBuscador && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-2/3 p-6 rounded shadow-lg">
            <input
              autoFocus
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleBuscadorKeys}
              placeholder="Buscar producto..."
              className="w-full border p-2 mb-4 rounded"
            />

            <div className="max-h-80 overflow-y-auto">
              {resultados.map((item, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer ${index === indiceSeleccionado ? "bg-blue-200" : ""}`}
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
        </div>
      )}

      {mostrarModalPago && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded shadow-lg">
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
                onChange={(e) => setEfectivoPago(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm mb-1">Transferencia</label>
              <input
                type="number"
                min="0"
                value={transferenciaPago}
                onChange={(e) => setTransferenciaPago(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>

            <div className="mb-5">
              <div className="text-sm text-gray-600">Devolver</div>
              <div className="text-xl font-semibold">${devolver.toLocaleString()}</div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setMostrarModalPago(false)} className="px-4 py-2 border rounded">
                Cancelar
              </button>
              <button
                onClick={() => void guardarVenta()}
                disabled={guardandoVenta}
                className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {guardandoVenta ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
