import * as transport from "@/services/transport"

const USER_KEY = "user"
const TOKEN_KEY = "token"

export const login = async (usuario, password) => {
  const result = await transport.post("/auth/login", {
    usuario,
    password
  })

  if (!result.success) {
    throw new Error(result.error || "Error al iniciar sesion")
  }

  const { id, token, usuario: userName, rol } = result.data

  const userData = {
    id,
    usuario: userName,
    role: rol,
    token
  }

  sessionStorage.setItem(USER_KEY, JSON.stringify(userData))
  sessionStorage.setItem(TOKEN_KEY, token)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)

  return userData
}

export const getUser = () => {
  const user = sessionStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export const logout = () => {
  sessionStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export const verifyPassword = async (password) => {
  const result = await transport.post("/auth/verify-password", { password })

  if (!result.success) {
    throw new Error(result.error || "Error validando contrasena")
  }

  return true
}
