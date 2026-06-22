/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import '../styles/Mesero.css';
import '../App.css';
import { useEffect, useState } from "react";
import api from "../services/api";
import { obtenerMesas, obtenerTodosLosPedidos, cambiarEstadoPedido, liberarMesa as liberarMesaServicio } from "../services/pedidos";
import { FaUserTie, FaSignOutAlt, FaChair, FaBell, FaUtensils, FaUsers, FaClipboardList, FaCheckCircle, FaTruck, FaClock, FaTimes } from "react-icons/fa";

const normalizarEstado = (estado = "") => String(estado).toUpperCase();

function Panel_Mesero({ usuario, setPagina }) {
  const [mesas, setMesas] = useState([]);
  const [countClientes, setCountClientes] = useState(0);
  const [countCocina, setCountCocina] = useState(0);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [mesaPedidoActiva, setMesaPedidoActiva] = useState(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);
  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [mostrarPedidosListos, setMostrarPedidosListos] = useState(false);
  const [pedidosListos, setPedidosListos] = useState([]);
  const [cargandoPedidosListos, setCargandoPedidosListos] = useState(false);

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

  const obtenerPedidosListosRecoger = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const res = await api.get("/mesas/pedidos/listos-recoger", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPedidosListos(res.data?.datos || []);
    } catch (error) {
      console.error("Error al obtener pedidos listos:", error);
    }
  };

  useEffect(() => {
    cargarDatosPanel();
  }, []);

  useEffect(() => {
    if (!mostrarPedidosListos) return;
    
    // Obtener datos inmediatamente
    obtenerPedidosListosRecoger();
    
    // Luego cada 30 segundos
    const intervalo = setInterval(obtenerPedidosListosRecoger, 30000);
    return () => clearInterval(intervalo);
  }, [mostrarPedidosListos]);

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
        <h1 className="titulo-panel"><FaUserTie /> PANEL MESERO</h1>
        <div className="perfil-info">
          <div>
            <span className="label-rol">MESERO ACTIVO</span>
            <h2 className="nombre-usuario">{usuario?.nombre}</h2>
          </div>
          <button className="btn-salir-header" onClick={cerrarSesion}><FaSignOutAlt /> SALIR</button>
        </div>
      </div>

      <div className='seccion-mesas'>
        <div className='titulo-seccion'>
          <h3><FaChair /> MESAS</h3>
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
              <span className='estado-texto'><span className="mesa-status-dot"></span>{mesa.estado}</span>
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
          <h3><FaUsers /> Mensajes Clientes</h3>
          <p className={countClientes > 0 ? "notificacion-activa" : ""}>{countClientes}</p>
        </div>
        <div className="btn-mensaje2" onClick={() => setMostrarPedidosListos(true)}>
          <h3><FaTruck /> Pedidos Listos</h3>
          <p className={pedidosListos.length > 0 ? "notificacion-activa" : ""}>{pedidosListos.length}</p>
        </div>
      </div>

      <div className="Botones">
        <button className="btn-1" onClick={() => setPagina("menuMesero")}><FaClipboardList /> Tomar Pedido</button>
        <button className="btn-2" onClick={() => setPagina("mensajecliente")}><FaBell /> Mensajes Clientes</button>
        <button className="btn-3" onClick={() => setMostrarPedidosListos(true)}><FaTruck /> Pedidos Listos</button>
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

              <div className="mesero-modal-detalles">
                <p className="mesero-modal-detalles-titulo">Detalles</p>
                {(pedidoActivo.detalles || []).map((d) => (
                  <div key={d.id} className="mesero-modal-detalle-item">
                    <div>{d.cantidad}x {d.platillo_nombre}</div>
                    <div className="mesero-modal-detalle-subtotal">
                      Subtotal: ${Number(d.subtotal || 0).toLocaleString("es-CO")}
                    </div>
                    {d.notas && (
                      <div className="mesero-modal-detalle-nota">Nota: {d.notas}</div>
                    )}
                  </div>
                ))}
              </div>
                  </>
                );
              })()}
            </div>

            <div className="emp-modal-footer mesero-modal-footer-actions">
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
                className="mesero-btn-editar"
                onClick={editarPedido}
                disabled={actualizandoEstado || normalizarEstado(pedidoActivo.estado) !== "PENDIENTE"}
              >
                Editar Pedido
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
                  className="emp-btn-guardar mesero-btn-pagado"
                  onClick={() => actualizarEstadoPedido("PAGADO")}
                  disabled={actualizandoEstado}
                >
                  {actualizandoEstado ? "Procesando..." : "PAGADO Y LIBERAR"}
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

            <div className="emp-modal-body mesero-modal-success">
              <div className="mesero-modal-success-icon"><FaCheckCircle /></div>
              <p className="mesero-modal-success-title">
                ¡El pedido ha sido completado!
              </p>
              <p className="mesero-modal-success-desc">
                No hay pedido activo. Si los comensales ya se retiraron, puedes liberar la mesa manualmente.
              </p>
            </div>

            <div className="emp-modal-footer mesero-modal-footer-actions">
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
                className="emp-btn-guardar mesero-btn-liberar"
                onClick={liberarMesa}
                disabled={actualizandoEstado}
              >
                {actualizandoEstado ? "Liberando..." : "Liberar Mesa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cargandoPedido && (
        <div className="emp-modal-overlay">
          <div className="emp-modal mesero-loading-modal">
            Cargando pedido activo...
          </div>
        </div>
      )}

      {mostrarPedidosListos && (
        <div
          className="emp-modal-overlay"
          onClick={() => setMostrarPedidosListos(false)}
        >
          <div className="mesero-modal-listos" onClick={(e) => e.stopPropagation()}>
            <div className="mesero-listos-header">
              <h2 className="mesero-listos-titulo"><FaTruck /> Pedidos Listos para Recoger</h2>
              <button
                className="mesero-listos-close"
                onClick={() => setMostrarPedidosListos(false)}
                title="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mesero-listos-body">
              {cargandoPedidosListos && (
                <div className="mesero-listos-loading">Cargando...</div>
              )}

              {!cargandoPedidosListos && pedidosListos.length === 0 && (
                <div className="mesero-listos-empty">
                  <p>✓ No hay pedidos listos para recoger</p>
                </div>
              )}

              {!cargandoPedidosListos && pedidosListos.length > 0 && (
                <div className="mesero-listos-grid">
                  {pedidosListos.map((pedido) => (
                    <div key={pedido.id} className="mesero-listo-card">
                      <div className="mesero-listo-header">
                        <span className="mesero-listo-mesa">Mesa #{pedido.mesa_numero}</span>
                        <span className="mesero-listo-tiempo">
                          <FaClock /> {pedido.minutos_transcurridos} min
                        </span>
                      </div>

                      <div className="mesero-listo-info">
                        <p className="mesero-listo-mesero">
                          Mesero: {pedido.mesero_nombre} {pedido.mesero_apellido}
                        </p>
                        <p className="mesero-listo-total">
                          Total: ${Number(pedido.total || 0).toLocaleString("es-CO")}
                        </p>
                      </div>

                      <div className="mesero-listo-items">
                        <p className="mesero-listo-items-title">Platillos:</p>
                        {(pedido.detalles || []).map((detalle, idx) => (
                          <div key={idx} className="mesero-listo-item">
                            <span className="mesero-listo-item-qty">{detalle.cantidad}x</span>
                            <span className="mesero-listo-item-name">{detalle.platillo_nombre}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        className="mesero-listo-btn-recoger"
                        onClick={() => alert(`Pedido #${pedido.id} de Mesa #${pedido.mesa_numero} listo para recoger`)}
                      >
                        <FaCheckCircle /> Listo para Recoger
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mesero-listos-footer">
              <button
                className="mesero-listos-actualizar"
                onClick={obtenerPedidosListosRecoger}
              >
                Actualizar Ahora
              </button>
              <p className="mesero-listos-auto-refresh">Se actualiza automáticamente cada 30 segundos</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Panel_Mesero;