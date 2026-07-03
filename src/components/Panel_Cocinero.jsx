/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import api from "../services/api";
import { cambiarEstadoPedido } from "../services/pedidos";
import { reproducirTimbre } from "../services/sonidos";
import '../styles/Cocinero.css';
import '../App.css';
import { FaSignOutAlt, FaUserTie, FaClock, FaUtensils, FaClipboardCheck } from "react-icons/fa";

function Panel_Cocinero({ usuario, setPagina }) {
  const [pedidosCocina, setPedidosCocina] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoPedidoId, setProcesandoPedidoId] = useState(null);
  const [tiempoActual, setTiempoActual] = useState(Date.now());

  if (!usuario) {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) { usuario = usuarioGuardado; }
  }

  useEffect(() => {
    cargarPedidosCocina();
    // Refresca cada 15 segundos para ver nuevos pedidos
    const intervalo = setInterval(cargarPedidosCocina, 15000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    // Actualiza el tiempo cada segundo para que el contador sea dinámico
    const intervaloTiempo = setInterval(() => {
      setTiempoActual(Date.now());
    }, 1000);
    return () => clearInterval(intervaloTiempo);
  }, []);

  const cargarPedidosCocina = async () => {
    try {
      const res = await api.get("/mesas/pedidos/activos/cocina");
      const pedidos = res.data?.datos || [];
      setPedidosCocina(pedidos);
      setCargando(false);
    } catch (error) {
      console.error("Error cargando pedidos de cocina:", error);
      setCargando(false);
    }
  };

  const cambiarEstadoDesdeCocina = async (pedidoId, estado) => {
    if (!pedidoId || !estado) return;

    setProcesandoPedidoId(pedidoId);
    try {
      await cambiarEstadoPedido(pedidoId, estado);
<<<<<<< HEAD
      
      // Reproducir timbre si es para entrega
      if (estado === "PARA_ENTREGA") {
        reproducirTimbre();
      }
      
=======
>>>>>>> bff1d4b2e594698cdf995784fcc655791519d257
      await cargarPedidosCocina();
    } catch (error) {
      alert(error?.response?.data?.error || "No se pudo actualizar el estado del pedido");
    } finally {
      setProcesandoPedidoId(null);
    }
  };

  const normalizarEstado = (estado = "") => String(estado).toUpperCase();

  const accionCocina = (estadoActual) => {
    if (estadoActual === "PENDIENTE") {
      return { estado: "COCINANDO", texto: "INICIAR COCINANDO" };
    }
    if (estadoActual === "COCINANDO") {
      return { estado: "PARA_ENTREGA", texto: "MARCAR PARA_ENTREGA" };
    }
    return null;
  };

  const formatearTiempo = (minutos) => {
    if (minutos < 1) return "< 1 min";
    if (minutos < 60) return `${Math.floor(minutos)} min`;
    const horas = Math.floor(minutos / 60);
    const mins = Math.floor(minutos % 60);
    return `${horas}h ${mins}m`;
  };

  const calcularTiempoTranscurrido = (pedido) => {
    // Si viene con fecha_creacion del backend, usarla para calcular dinámicamente
    if (pedido.fecha_creacion) {
      const fechaCreacion = new Date(pedido.fecha_creacion).getTime();
      const tiempoTranscurridoMs = tiempoActual - fechaCreacion;
      const minutos = tiempoTranscurridoMs / 1000 / 60;
      return formatearTiempo(minutos);
    }
    // Si no, usar minutos_abierto del backend
    return formatearTiempo(pedido.minutos_abierto || 0);
  };

  const claseEstado = (estado = "") => {
    const estadoNorm = normalizarEstado(estado);
    if (estadoNorm === "PENDIENTE") return "kitchen-estado-pendiente";
    if (estadoNorm === "COCINANDO") return "kitchen-estado-cocinando";
    if (estadoNorm === "PARA_ENTREGA") return "kitchen-estado-entrega";
    return "kitchen-estado-default";
  };

  let contenidoPedidos = null;

  if (cargando) {
    contenidoPedidos = (
      <div className="kitchen-loading">
        <p>Cargando pedidos...</p>
      </div>
    );
  } else if (pedidosCocina.length === 0) {
    contenidoPedidos = (
      <div className="kitchen-no-orders">
        <p>No hay pedidos pendientes. Buen trabajo, Chef.</p>
      </div>
    );
  }

  const renderPedidos = () => {
    if (cargando) {
      return (
        <div className="kitchen-loading">
          <p>Cargando pedidos...</p>
        </div>
      );
    }
    if (pedidosCocina.length === 0) {
      return (
        <div className="kitchen-no-orders">
          <p>No hay pedidos pendientes. Buen trabajo, Chef.</p>
        </div>
      );
    }
    return (
      <div className="kitchen-orders-grid">
        {pedidosCocina.map((pedido) => (
          <div key={pedido.id} className="kitchen-order-card">
            {(() => {
              const estadoActual = normalizarEstado(pedido.estado);
              const accion = accionCocina(estadoActual);
              const procesando = procesandoPedidoId === pedido.id;

              return (
                <>
                  <div className="kitchen-order-header">
                    <div className="kitchen-order-mesa">
                      <span className="kitchen-mesa-number">MESA {pedido.mesa_numero}</span>
                    </div>
                    <div className="kitchen-order-meta">
                      {pedido.usuario?.nombre && (
                        <span className="kitchen-mesero">Mesero: {pedido.usuario.nombre}</span>
                      )}
                      {(() => {
                        // Calcular minutos para la alerta
                        let minutosActuales = pedido.minutos_abierto || 0;
                        if (pedido.fecha_creacion) {
                          const fechaCreacion = new Date(pedido.fecha_creacion).getTime();
                          const tiempoTranscurridoMs = tiempoActual - fechaCreacion;
                          minutosActuales = tiempoTranscurridoMs / 1000 / 60;
                        }
                        return (
                          <span className={`kitchen-tiempo ${minutosActuales > 20 ? "alerta" : ""}`}>
                            <FaClock /> {calcularTiempoTranscurrido(pedido)}
                          </span>
                        );
                      })()}
                      <span className={`kitchen-estado-pill ${claseEstado(estadoActual)}`}>{estadoActual || "N/A"}</span>
                    </div>
                  </div>

                  <div className="kitchen-order-body">
                    {(pedido.detalles || []).length === 0 ? (
                      <p className="kitchen-sin-items">Sin items para cocinar</p>
                    ) : (
                      <ul className="kitchen-items-list">
                        {pedido.detalles.map((detalle) => (
                          <li key={detalle.id} className="kitchen-item">
                            <span className="kitchen-item-qty">{detalle.cantidad}x</span>
                            <span className="kitchen-item-nombre">{detalle.platillo_nombre}</span>
                            {detalle.notas && (
                              <span className="kitchen-item-notas">{detalle.notas}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="kitchen-order-footer">
                    {accion ? (
                      <button
                        className="kitchen-btn-entregado"
                        onClick={() => cambiarEstadoDesdeCocina(pedido.id, accion.estado)}
                        disabled={procesando}
                      >
                        {procesando ? "Procesando..." : <><FaClipboardCheck /> {accion.texto}</>}
                      </button>
                    ) : (
                      <button className="kitchen-btn-entregado" disabled>
                        SIN ACCION EN COCINA
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>
    );
  };

  // Para compatibilidad, asignar a contenidoPedidos también
  contenidoPedidos = renderPedidos();

  return (
    <div className="kitchen-container">
      <header className="kitchen-header">
        <div className="kitchen-header-center">
          <h1 className="kitchen-main-title"><FaUtensils /> PANEL DE COCINA</h1>
          <p className="kitchen-chef-info"><FaUserTie /> Chef: {usuario?.nombre} {usuario?.apellido}</p>
        </div>
        <button onClick={() => { localStorage.removeItem("usuario"); localStorage.removeItem("paginaActual"); setPagina("login"); }} className="kitchen-btn-salir">
          <FaSignOutAlt /> SALIR
        </button>
      </header>

      <div className="kitchen-board">
        <h2 className="kitchen-subtitle">ORDENES ACTIVAS EN COCINA</h2>
        {renderPedidos()}
      </div>

      <footer className="kitchen-footer">
        <p className="kitchen-footer-text">
          Total de pedidos pendientes: <strong>{pedidosCocina.length}</strong>
        </p>
      </footer>
    </div>
  );
}

export default Panel_Cocinero;