import * as transport from "@/services/transport"

export const registrarVenta = async (payload) => {
  const result = await transport.post("/ventas", payload)

  if (!result.success) {
    throw new Error(result.error || "Error registrando venta")
  }

  return result.data
}
