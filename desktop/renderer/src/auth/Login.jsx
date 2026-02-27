import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "./useAuth"
import { ROLES } from "./roles"

export default function Login() {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")

  const { login } = useAuth()
  const navigate = useNavigate()

  const ingresar = async () => {
    if (!usuario.trim() || !password.trim()) {
      alert("Datos incompletos")
      return
    }

    try {
      const user = await login(usuario, password)

      if (user.role === ROLES.ADMIN) {
        navigate("/admin")
      } else {
        navigate("/vendedor")
      }
    } catch (error) {
      console.error(error)
      alert(error?.message || "Error al iniciar sesion")
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    ingresar()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow w-96"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Tienda de Calzado
        </h1>

        <input
          type="text"
          placeholder="Usuario"
          className="w-full mb-3 p-2 border rounded"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
        />

        <input
          type="password"
          placeholder="Contrasena"
          className="w-full mb-4 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Ingresar
        </button>
      </form>
    </div>
  )
}
