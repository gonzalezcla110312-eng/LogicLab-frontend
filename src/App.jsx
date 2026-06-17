import { useState, useEffect } from 'react'
import Login from './components/Login'
import VistaCliente from './components/VistaCliente'
import Panel_Mesero from './components/Panel_Mesero'
import Panel_Cocinero from './components/Panel_Cocinero'
import Panel_Administrador from './components/Admin/Panel_Administrador'
import Empleados from './components/Admin/Empleados'
import Platos from './components/Admin/Platos'
import Menus from './components/Admin/Menus'
import MenuDia from './components/MenuDia'
import MenuMesero from './components/MenuMesero'
import EditarPedido from './components/EditarPedido'
import Recuperacion from './components/Recuperacion'
import MensajeCliente from './components/MensajeCliente'
import MensajeCocina from './components/MensajeCocina'

const PAGINAS_PUBLICAS = ["login", "recuperacion"]

function App() {
  const [pagina, setPagina] = useState("login")
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"))
    if (!usuarioGuardado) return

    const paginaGuardada = localStorage.getItem("paginaActual")
    const redireccionPorRol = {
      Mesero: "mesero",
      Cocinero: "cocinero",
      Administrador: "admin",
    }

    setUsuario(usuarioGuardado)
    if (paginaGuardada && !PAGINAS_PUBLICAS.includes(paginaGuardada)) {
      setPagina(paginaGuardada)
    } else {
      setPagina(redireccionPorRol[usuarioGuardado.rol] ?? "login")
    }
  }, [])

  const cambiarPagina = (nuevaPagina) => {
    if (PAGINAS_PUBLICAS.includes(nuevaPagina)) {
      localStorage.removeItem("paginaActual")
      localStorage.removeItem("usuario")
      localStorage.removeItem("token")
    } else {
      localStorage.setItem("paginaActual", nuevaPagina)
    }
    setPagina(nuevaPagina)
  }

  const props = { usuario, setPagina: cambiarPagina }

  return (
    <>
      {pagina === "login" && <Login setPagina={cambiarPagina} setUsuario={setUsuario} />}
      {pagina === "vistacliente" && <VistaCliente {...props} />}
      {pagina === "mesero" && <Panel_Mesero {...props} />}
      {pagina === "cocinero" && <Panel_Cocinero {...props} />}
      {pagina === "admin" && <Panel_Administrador {...props} />}
      {pagina === "empleados" && <Empleados {...props} />}
      {pagina === "platos" && <Platos {...props} />}
      {pagina === "menus" && <Menus {...props} />}
      {pagina === "menu" && <MenuDia {...props} />}
      {pagina === "menuMesero" && <MenuMesero {...props} />}
      {pagina === "editarPedido" && <EditarPedido {...props} />}
      {pagina === "recuperacion" && <Recuperacion setPagina={cambiarPagina} />}
      {pagina === "mensajecliente" && <MensajeCliente setPagina={cambiarPagina} />}
      {pagina === "mensajecocina" && <MensajeCocina setPagina={cambiarPagina} />}
    </>
  )
}

export default App