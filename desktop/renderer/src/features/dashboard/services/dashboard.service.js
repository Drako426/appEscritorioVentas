import * as transport from "@/services/transport"

export const getDashboard = async () => {
  const result = await transport.get("/dashboard")

  if (!result.success) {
    throw new Error(result.error || "Error cargando dashboard")
  }

  return result.data
}
