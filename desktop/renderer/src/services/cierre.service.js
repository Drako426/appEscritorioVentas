import * as transport from "@/services/transport"

export const generarCierre = async (data) => {
  const result = await transport.post("/cierre", data)

  if (!result.success) {
    throw new Error(result.error || "Error generando cierre")
  }

  return result.data
}
