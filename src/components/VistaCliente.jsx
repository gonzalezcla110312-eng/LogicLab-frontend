import { useEffect, useState } from "react";
import api, { construirUrlImagen } from "../services/api";
import { obtenerMenuDia } from "../services/menuDia";
import '../styles/Cliente.css';
import '../App.css';

const IMG_CATEGORIA = {
    "1": "/CartaCorriente.png",
    "2": "/CartaComidaRapida.png",
    "3": "/CartaEspecial.png",
    "4": "/CartaBebidas.png",
}

const TarjetaPlato = ({ plato, agregado, expandida, cantidad, peticion, 
  onTogglePlato, onCambiarCantidad, onToggleCarrito, onCambiarPeticion }) => {
  const imagenPlato = construirUrlImagen(plato.imagen_url) || (IMG_CATEGORIA[plato.CategoriaId] ?? "/CartaCorriente.png");

  return (
    <div className={`vc-tarjeta ${agregado ? "vc-tarjeta-agregada" : ""}`}>
      <div className="vc-tarjeta-fila" onClick={() => onTogglePlato(plato)}>
        <div className="vc-tarjeta-img-wrap">
          <img
            src={imagenPlato}
            alt={plato.NombrePlato}
            className="vc-tarjeta-img"
          />
        </div>
        <div className="vc-tarjeta-body">
          <p className="vc-tarjeta-nombre">{plato.NombrePlato}</p>
          <p className="vc-tarjeta-desc">{plato.Descripcion}</p>
          <p className="vc-tarjeta-precio">${plato.Precio.toLocaleString("es-CO")}</p>

          <div className="vc-tarjeta-bottom">
            <div className="vc-tarjeta-cantidad" onClick={e => e.stopPropagation()}>
              <button className="vc-cant-btn" onClick={() => onCambiarCantidad(plato.id, -1)}>−</button>
              <span className="vc-cant-num">{cantidad}</span>
              <button className="vc-cant-btn" onClick={() => onCambiarCantidad(plato.id, 1)}>+</button>
            </div>
            <button
              className={`vc-tarjeta-btn ${agregado ? "vc-tarjeta-btn-quitar" : ""}`}
              onClick={e => { e.stopPropagation(); onToggleCarrito(plato) }}
            >
              {agregado ? "✕" : "+ Agregar al pedido"}
            </button>
          </div>
        </div>
      </div>

      {expandida && (
        <div className="vc-tarjeta-peticion-wrap" onClick={e => e.stopPropagation()}>
          <input
            className="vc-tarjeta-peticion-input"
            type="text"
            placeholder="Peticiones: Ej: sin cebolla..."
            value={peticion}
            onChange={e => onCambiarPeticion(plato.id, e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

function VistaCliente({ setPagina }) {
  const [menuDelDia, setMenuDelDia] = useState([])
  const [mesaActiva, setMesaActiva] = useState("")
  const [cantidades, setCantidades] = useState({})
  const [peticiones, setPeticiones] = useState({})
  const [carrito, setCarrito] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [platoAbierto, setPlatoAbierto] = useState(null)

  useEffect(() => {
    const cargarVistaCliente = async () => {
      const mesaGuardada = localStorage.getItem("mesa_activa")
      if (mesaGuardada) setMesaActiva(mesaGuardada)

      try {
        const menuDia = await obtenerMenuDia("hoy")
        setMenuDelDia(menuDia)
      } catch (error) {
        console.error("No se pudo cargar el menú:", error)
        setMenuDelDia([])
      }
    }

    cargarVistaCliente()
  }, [])

  const platosMenu  = menuDelDia.filter(p => p.CategoriaId !== "4")
  const bebidasMenu = menuDelDia.filter(p => p.CategoriaId === "4")

  const getCantidad = (id) => cantidades[id] || 1
  const getPeticion = (id) => peticiones[id] || ""

  const cambiarCantidad = (id, valor) => {
    setCantidades(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + valor) }))
  }

  const togglePlato = (plato) => {
    setPlatoAbierto(prev => prev === plato.id ? null : plato.id)
  }

  const enCarrito = (id) => carrito.some(i => i.plato.id === id)

  const toggleCarrito = (plato) => {
    if (enCarrito(plato.id)) {
      setCarrito(prev => prev.filter(i => i.plato.id !== plato.id))
    } else {
      setCarrito(prev => [...prev, {
        plato,
        cantidad: getCantidad(plato.id),
        peticion: getPeticion(plato.id),
      }])
    }
  }

  const quitarDelCarrito = (id) => setCarrito(prev => prev.filter(i => i.plato.id !== id))

  const cambiarPeticion = (id, valor) => {
    setPeticiones(prev => ({ ...prev, [id]: valor }))
  }

  const carritoPlatos  = carrito.filter(i => i.plato.CategoriaId !== "4")
  const carritoBebidas = carrito.filter(i => i.plato.CategoriaId === "4")

  const formatPrecio = (precio) => `$${precio.toLocaleString("es-CO")}`

  const enviarPedido = async () => {
    if (carrito.length === 0) return
    if (!mesaActiva) {
      alert("No hay mesa activa para este cliente. Solicita apoyo del mesero.")
      return
    }

    setEnviando(true)
    try {
      const items = carrito.map((item) => ({
        platillo_id: item.plato.id,
        cantidad: item.cantidad,
      }))

      await api.post(`/mesas/${mesaActiva}/pedidos`, { items })

      localStorage.setItem("mesa_activa", String(mesaActiva))
      setCarrito([])
      setCantidades({})
      setPeticiones({})
      alert(`¡Pedido enviado al mesero para la Mesa #${mesaActiva}!`)
    } catch (err) {
      alert("Hubo un error al enviar el pedido.")
    } finally {
      setEnviando(false)
    }
  }

  if (menuDelDia.length === 0) {
    return (
      <div className="vc-container">
        <header className="vc-header">
          <span className="vc-badge-mesa">Mesa #{mesaActiva}</span>
          <div className="vc-header-center">
            <h1 className="vc-logo">Restaurante Mangata</h1>
          </div>
          <button className="vc-btn-salir" onClick={() => setPagina("login")}>SALIR</button>
        </header>
        <div className="vc-vacio">
          <p>El menú de hoy aún no está listo.</p>
          <span>El administrador lo publicará en breve.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="vc-container">
      <header className="vc-header">
        <span className="vc-badge-mesa">{mesaActiva ? `Mesa #${mesaActiva}` : "Mesa sin asignar"}</span>
        <div className="vc-header-center">
          <h1 className="vc-logo">Restaurante Mangata</h1>
          <p className="vc-menu-dia-label">Menú del Día</p>
        </div>
        <button className="vc-btn-salir" onClick={() => setPagina("login")}>SALIR</button>
      </header>

      {platosMenu.length > 0 && (
        <section className="vc-seccion">
          <h2 className="vc-seccion-titulo">Platos</h2>
          <div className="vc-grid">
            {platosMenu.map(plato => (
              <TarjetaPlato
                key={plato.id}
                plato={plato}
                agregado={enCarrito(plato.id)}
                expandida={platoAbierto === plato.id}
                cantidad={getCantidad(plato.id)}
                peticion={getPeticion(plato.id)}
                onTogglePlato={togglePlato}
                onCambiarCantidad={cambiarCantidad}
                onToggleCarrito={toggleCarrito}
                onCambiarPeticion={cambiarPeticion}
              />
            ))}
          </div>
        </section>
      )}

      {bebidasMenu.length > 0 && (
        <section className="vc-seccion">
          <h2 className="vc-seccion-titulo">Bebidas</h2>
          <div className="vc-grid">
            {bebidasMenu.map(plato => (
              <TarjetaPlato
                key={plato.id}
                plato={plato}
                agregado={enCarrito(plato.id)}
                expandida={platoAbierto === plato.id}
                cantidad={getCantidad(plato.id)}
                peticion={getPeticion(plato.id)}
                onTogglePlato={togglePlato}
                onCambiarCantidad={cambiarCantidad}
                onToggleCarrito={toggleCarrito}
                onCambiarPeticion={cambiarPeticion}
              />
            ))}
          </div>
        </section>
      )}

      {carrito.length > 0 && (
        <section className="vc-pedido">
          <h2 className="vc-pedido-titulo">Pedido</h2>

          {carritoPlatos.length > 0 && (
            <div className="vc-pedido-grupo">
              <p className="vc-pedido-grupo-label">Platos</p>
              {carritoPlatos.map(item => (
                <div key={item.plato.id} className="vc-pedido-item">
                  <div className="vc-pedido-item-info">
                    <span className="vc-pedido-nombre">{item.cantidad}x {item.plato.NombrePlato}</span>
                    {item.peticion && <span className="vc-pedido-peticion">{item.peticion}</span>}
                  </div>
                  <div className="vc-pedido-item-right">
                    <span className="vc-pedido-precio">{formatPrecio(item.plato.Precio * item.cantidad)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {carritoBebidas.length > 0 && (
            <div className="vc-pedido-grupo">
              <p className="vc-pedido-grupo-label">Bebidas</p>
              {carritoBebidas.map(item => (
                <div key={item.plato.id} className="vc-pedido-item">
                  <div className="vc-pedido-item-info">
                    <span className="vc-pedido-nombre">{item.cantidad}x {item.plato.NombrePlato}</span>
                    {item.peticion && <span className="vc-pedido-peticion">{item.peticion}</span>}
                  </div>
                  <div className="vc-pedido-item-right">
                    <span className="vc-pedido-precio">{formatPrecio(item.plato.Precio * item.cantidad)}</span>
                    <button className="vc-pedido-quitar" onClick={() => quitarDelCarrito(item.plato.id)}>quitar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button className="vc-btn-enviar" onClick={enviarPedido} disabled={enviando}>
            {enviando ? "Llamando..." : "Llamar mesero"}
          </button>
        </section>
      )}
    </div>
  )
}

export default VistaCliente;