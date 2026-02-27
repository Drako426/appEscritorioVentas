import axios from "axios"

function emitBackendHealth(reachable) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent("backend-health-status", {
      detail: { reachable }
    })
  )
}

function resolveApiBase() {
  const envUrl = import.meta.env.VITE_API_URL?.trim()
  if (envUrl) return envUrl

  return "/api"
}

const api = axios.create({
  baseURL: resolveApiBase(),
  withCredentials: true,
  timeout: 15000
})

api.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") ||
    localStorage.getItem("token")

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    emitBackendHealth(true)
    return response
  },
  (error) => {
    // Si hay response, backend respondio (401/403/500, etc). Sin response = caida/red.
    emitBackendHealth(Boolean(error?.response))
    return Promise.reject(error)
  }
)

export async function backendDisponible() {
  try {
    await api.get("/dashboard")
    return true
  } catch {
    return false
  }
}

export default api
