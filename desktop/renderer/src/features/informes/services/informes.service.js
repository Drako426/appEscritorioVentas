import * as transport from "@/services/transport"

export const getInformeGeneral = async (desde, hasta) => {
  const result = await transport.get("/informes", {
    params: { desde, hasta }
  })

  if (!result.success) {
    throw new Error(result.error || "Error obteniendo informe")
  }

  return result.data
}
