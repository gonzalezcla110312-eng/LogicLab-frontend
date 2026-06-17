import '../styles/Mesero.css';
import '../App.css';
import { useEffect, useState } from "react";
import api from "../services/api";
import { obtenerMesas, obtenerTodosLosPedidos, cambiarEstadoPedido, liberarMesa as liberarMesaServicio } from "../services/pedidos";

const normalizarEstado = (estado = "") => String(estado).toUpperCase();

function Panel_Mesero({ usuario, setPagina }) {
  const [mesas, setMesas] = useState([]);
  const [countClientes, setCountClientes] = useState(0);
  const [countCocina, setCountCocina] = useState(0);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [mesaPedidoActiva, setMesaPedidoActiva] = useState(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);

  if (!usuario) {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) { usuario = usuarioGuardado; }
  }

  const cargarDatosPanel = async () => {
    try {
      const [mesasData, pedidos] = await Promise.all([
        obtenerMesas(),
        obtenerTodosLosPedidos(),
      ]);

      setMesas(mesasData);
      setCountClientes(pedidos.filter((p) => normalizarEstado(p.estadoPedido) === "PARA_ENTREGA").length);
      setCountCocina(
        pedidos.filter((p) => {
          const estado = normalizarEstado(p.estadoPedido);
          return estado === "PENDIENTE" || estado === "COCINANDO";
        }).length
      );
    } catch (error) {
      console.error("Error al cargar datos del panel:", error);
    }
  };

  useEffect(() => {
    cargarDatosPanel();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("paginaActual");
    localStorage.removeItem("token");
    setPagina("login");
  };

  const verPedidoActivo = async (e, mesa) => {
    e.stopPropagation();
    setCargandoPedido(true);
    try {
      const res = await api.get(`/mesas/${mesa.id}/pedido-activo`);
      setPedidoActivo(res.data?.datos || null);
      // Siempre mantener la mesa activa, incluso si no hay pedido
      setMesaPedidoActiva(mesa);
    } catch (error) {
      // Si es un error 404 (no hay pedido), mostrar modal de pedido completado
      if (error.response?.status === 404) {
        setPedidoActivo(null);
        setMesaPedidoActiva(mesa);
      } else {
        alert(error.response?.data?.error || "No se pudo cargar el pedido activo.");
        setPedidoActivo(null);
        setMesaPedidoActiva(null);
      }
    } finally {
      setCargandoPedido(false);
    }
  };

  const actualizarEstadoPedido = async (estado) => {
    if (!pedidoActivo?.id) return;
    setActualizandoEstado(true);
    try {
      await cambiarEstadoPedido(pedidoActivo.id, estado);
      if (estado === "PAGADO") {
        alert("Pedido pagado. La mesa se liberó automáticamente.");
      } else {
        alert(`Pedido actualizado a estado ${estado}.`);
      }
      setPedidoActivo(null);
      setMesaPedidoActiva(null);
      cargarDatosPanel();
    } catch (error) {
      alert(error.response?.data?.error || "No se pudo actualizar el estado del pedido.");
    } finally {
      setActualizandoEstado(false);
    }
  };

  const editarPedido = () => {
    if (!mesaPedidoActiva) return;
    const estadoActual = normalizarEstado(pedidoActivo?.estado);
    if (estadoActual !== "PENDIENTE") {
      alert("Solo puedes editar pedidos en estado PENDIENTE.");
      return;
    }
    localStorage.setItem("mesaSeleccionada", mesaPedidoActiva.numero);
    localStorage.setItem("mesaSeleccionadaId", String(mesaPedidoActiva.id));
    localStorage.setItem("pedidoIdEditar", String(pedidoActivo.id));
    setMesaPedidoActiva(null);
    setPedidoActivo(null);
    setPagina("editarPedido");
  };

  const liberarMesa = async () => {
    if (!mesaPedidoActiva?.id) return;
    setActualizandoEstado(true);
    try {
      await liberarMesaServicio(mesaPedidoActiva.id);
      alert("Mesa liberada correctamente.");
      setMesaPedidoActiva(null);
      setPedidoActivo(null);
      await cargarDatosPanel();
    } catch (error) {
      alert(error.response?.data?.error || "No se pudo liberar la mesa.");
    } finally {
      setActualizandoEstado(false);
    }
  };

  return (
    <div className="Panel-container">      
      <div className="header">
        <h1 className="titulo-panel">PANEL MESERO</h1>
        <div className="perfil-info">
          <div>
            <span className="label-rol">MESERO ACTIVO</span>
            <h2 className="nombre-usuario">{usuario?.nombre}</h2>
          </div>
          <button className="btn-salir-header" onClick={cerrarSesion}>SALIR</button>
        </div>
      </div>

      <div className='seccion-mesas'>
        <div className='titulo-seccion'>
          <h3>MESAS</h3>
        </div>
        <div className='mesas-grid'>
          {mesas.map((mesa) => (
            <div key={mesa.id}
              className={`mesa-card ${mesa.estado.toLowerCase()}`}
              onClick={() => {
                if (mesa.estado !== "LIBRE") return;
                localStorage.setItem("mesaSeleccionada", mesa.numero);
                localStorage.setItem("mesaSeleccionadaId", String(mesa.id));
                setPagina("menuMesero");
              }}
            >
              <span className='numero-mesa'>{mesa.numero}</span>
              <span className='estado-texto'>{mesa.estado}</span>
              <button 
                className="btn-cambiar-estado"
                onClick={(e) => {
                  if (mesa.estado === "LIBRE") {
                    e.stopPropagation();
                    localStorage.setItem("mesaSeleccionada", mesa.numero);
                    localStorage.setItem("mesaSeleccionadaId", String(mesa.id));
                    setPagina("menuMesero");
                    return;
                  }
                  verPedidoActivo(e, mesa);
                }}
              >
                {mesa.estado === "LIBRE" ? "OCUPAR" : "VER PEDIDO"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className='contenedor-mensajes'>
        <div className="btn-mensaje1" onClick={() => setPagina("mensajecliente")}>
          <h3>Mensajes Clientes</h3>
          <p className={countClientes > 0 ? "notificacion-activa" : ""}>{countClientes}</p>
        </div>
        <div className="btn-mensaje2" onClick={() => setPagina("mensajecocina")}>
          <h3>Mensajes Cocina</h3>
          <p className={countCocina > 0 ? "notificacion-activa" : ""}>{countCocina}</p>
        </div>
      </div>

      <div className="Botones">
        <button className="btn-1" onClick={() => setPagina("menuMesero")}>Tomar Pedido</button>
        <button className="btn-2" onClick={() => setPagina("mensajecliente")}>Mensajes Clientes</button>
        <button className="btn-3" onClick={() => setPagina("mensajecocina")}>Mensajes Cocina</button>
      </div>

      {mesaPedidoActiva && pedidoActivo && (
        <div
          className="emp-modal-overlay"
          onClick={() => {
            if (actualizandoEstado) return;
            setMesaPedidoActiva(null);
            setPedidoActivo(null);
          }}
        >
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2 className="emp-modal-titulo">Pedido Activo</h2>
              <p className="emp-modal-nombre">Mesa #{mesaPedidoActiva.numero}</p>
            </div>

            <div className="emp-modal-body">
              {(() => {
                const estadoActual = normalizarEstado(pedidoActivo.estado);
                return (
                  <>
              <p><strong>ID Pedido:</strong> {pedidoActivo.id}</p>
              <p><strong>Estado:</strong> {estadoActual}</p>
              <p><strong>Total:</strong> ${Number(pedidoActivo.total || 0).toLocaleString("es-CO")}</p>

              <div style={{ marginTop: "0.8rem" }}>
                <p style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Detalles</p>
                {(pedidoActivo.detalles || []).map((d) => (
                  <div key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "0.45rem 0" }}>
                    <div>{d.cantidad}x {d.platillo_nombre}</div>
                    <div style={{ color: "#ddd", fontSize: "0.9rem" }}>
                      Subtotal: ${Number(d.subtotal || 0).toLocaleString("es-CO")}
                    </div>
                    {d.notas && (
                      <div style={{ color: "#bbb", fontSize: "0.85rem" }}>Nota: {d.notas}</div>
                    )}
                  </div>
                ))}
              </div>
                  </>
                );
              })()}
            </div>

            <div className="emp-modal-footer" style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <button
                className="emp-btn-cancelar"
                onClick={() => {
                  setMesaPedidoActiva(null);
                  setPedidoActivo(null);
                }}
                disabled={actualizandoEstado}
              >
                Cerrar
              </button>
              <button
                style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "6px", padding: "0.6rem 1rem", cursor: "pointer", fontWeight: "bold", flex: "1", minWidth: "120px" }}
                onClick={editarPedido}
                disabled={actualizandoEstado || normalizarEstado(pedidoActivo.estado) !== "PENDIENTE"}
              >
                ✏️ Editar Pedido
              </button>
              <button
                className="emp-btn-eliminar-modal"
                onClick={() => actualizarEstadoPedido("CANCELADO")}
                disabled={actualizandoEstado || normalizarEstado(pedidoActivo.estado) !== "PENDIENTE"}
              >
                {actualizandoEstado ? "Procesando..." : "Cancelar Pedido"}
              </button>
              {normalizarEstado(pedidoActivo.estado) === "PARA_ENTREGA" && (
                <button
                  className="emp-btn-guardar"
                  onClick={() => actualizarEstadoPedido("ENTREGADO")}
                  disabled={actualizandoEstado}
                >
                  {actualizandoEstado ? "Procesando..." : "✓ Marcar ENTREGADO"}
                </button>
              )}
              {normalizarEstado(pedidoActivo.estado) === "ENTREGADO" && (
                <button
                  className="emp-btn-guardar"
                  onClick={() => actualizarEstadoPedido("PAGADO")}
                  disabled={actualizandoEstado}
                  style={{ background: "#10b981" }}
                >
                  {actualizandoEstado ? "Procesando..." : "✓ PAGADO Y LIBERAR"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mesaPedidoActiva && !pedidoActivo && (
        <div
          className="emp-modal-overlay"
          onClick={() => {
            if (actualizandoEstado) return;
            setMesaPedidoActiva(null);
          }}
        >
          <div className="emp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="emp-modal-header">
              <h2 className="emp-modal-titulo">Pedido Completado</h2>
              <p className="emp-modal-nombre">Mesa #{mesaPedidoActiva.numero}</p>
            </div>

            <div className="emp-modal-body" style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✓</div>
              <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#10b981", marginBottom: "1rem" }}>
                ¡El pedido ha sido completado!
              </p>
              <p style={{ fontSize: "0.95rem", color: "#bbb", marginBottom: "1rem" }}>
                No hay pedido activo. Si los comensales ya se retiraron, puedes liberar la mesa manualmente.
              </p>
            </div>

            <div className="emp-modal-footer" style={{ display: "flex", gap: "0.6rem" }}>
              <button
                className="emp-btn-cancelar"
                onClick={() => {
                  setMesaPedidoActiva(null);
                }}
                disabled={actualizandoEstado}
              >
                Volver
              </button>
              <button
                className="emp-btn-guardar"
                onClick={liberarMesa}
                disabled={actualizandoEstado}
                style={{ flex: 1, background: "#10b981" }}
              >
                {actualizandoEstado ? "Liberando..." : "Liberar Mesa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cargandoPedido && (
        <div className="emp-modal-overlay">
          <div className="emp-modal" style={{ textAlign: "center" }}>
            Cargando pedido activo...
          </div>
        </div>
      )}
    </div>
  );
}

export default Panel_Mesero;