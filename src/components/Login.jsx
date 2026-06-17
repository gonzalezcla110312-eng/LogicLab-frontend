import { useState } from "react"
import api, { normalizarRol } from "../services/api"
import '../styles/Login.css'; // Importamos la nueva hoja de estilo
import '../App.css';

function Login({ setPagina, setUsuario }) {
  const [credentials, setCredentials] = useState({ user: "", pass: "" })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/usuarios/login", {
        email: credentials.user,
        password: credentials.pass,
      })

      const token = res.data?.token
      const usuarioBackend = res.data?.usuario

      if (!token || !usuarioBackend) {
        alert("Respuesta inválida del servidor")
        return
      }

      const usuarioNormalizado = {
        ...usuarioBackend,
        rol: normalizarRol(usuarioBackend.rol),
      }

      localStorage.setItem("token", token)
      localStorage.setItem("usuario", JSON.stringify(usuarioNormalizado))
      setUsuario(usuarioNormalizado)

      if (usuarioNormalizado.rol === "Mesero") {
        setPagina("mesero")
      } else if (usuarioNormalizado.rol === "Cocinero") {
        setPagina("cocinero")
      } else if (usuarioNormalizado.rol === "Administrador") {
        setPagina("admin")
      } else {
        alert("Rol no permitido")
      }
    } catch (error) {
      alert(error.response?.data?.error || "No se pudo iniciar sesión")
    }
  }

  const handleIngresoCliente = async (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("paginaActual");
    localStorage.removeItem("mesa_activa");
    setPagina("vistacliente");
  };

  return (
    <div className='login-page-container'>
      
      {/* FORMULARIO EMPLEADOS / ADMIN */}
      <form className='login-form-staff' onSubmit={handleSubmit}>
        <h2 className='login-title-staff'>Inicio de Sesión</h2>
        <input 
          type="text" 
          placeholder="Nombre de usuario" 
          value={credentials.user} 
          onChange={(e) => setCredentials({...credentials, user: e.target.value})}
          className="login-input-staff"
        />

        <input 
          type="password" 
          placeholder="Contraseña" 
          value={credentials.pass} 
          onChange={(e) => setCredentials({...credentials, pass: e.target.value})}
          className="login-input-staff"
        />

        <button type="submit" className="login-button-staff">Siguiente</button>
        
        <p className="login-forgot-pass" onClick={() => setPagina("recuperacion")}>
          Recuperación contraseña
        </p>
      </form>

      {/* FORMULARIO CLIENTE */}
      <form className="login-form-client" onSubmit={handleIngresoCliente}>
        <h2 className="login-title-client">Menú Digital - Cliente</h2>

        <button type="submit" className="login-button-client">
          Ver Menú
        </button>
      </form>
    </div>
  )
}

export default Login;