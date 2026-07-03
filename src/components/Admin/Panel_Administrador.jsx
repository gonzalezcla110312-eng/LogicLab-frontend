/* eslint-disable react/prop-types */
import { useState, useEffect } from "react"
import Empleados from './Empleados'
import Platos from './Platos'
import Menus from './Menus'
import Pqrs from './Pqrs'
import '../../styles/Administrador.css';
import '../../App.css';
import api from "../../services/api";
import { obtenerMenuDia } from "../../services/menuDia";

function Panel_Administrador({usuario, setPagina}){
  const [seccion, setSeccion] = useState("panel");
  const [resumenDashboard, setResumenDashboard] = useState({
    estadisticas: {},
    ingresos: {},
    tendencia_pedidos: [],
    platillos_top: [],
    alertas_pedidos: [],
  });

  // ── Estado del dashboard ──
  const [pedidosRealizados, setPedidosRealizados] = useState(0);
  const [gananciasHoy, setGananciasHoy] = useState(0);
  const [totalEntregados, setTotalEntregados] = useState(0);
  const [mesasOcupadas, setMesasOcupadas] = useState(0);
  const [totalMesas, setTotalMesas] = useState(0);
  const [menuDelDia, setMenuDelDia] = useState([]);

  const cargarDashboard = async () => {
    try {
      const resResumen = await api.get("/admin/dashboard/resumen");
      const datos = resResumen.data?.datos || {};
      const estadisticas = datos.estadisticas || {};
      const ingresos = datos.ingresos || {};

      setResumenDashboard({
        estadisticas,
        ingresos,
        tendencia_pedidos: datos.tendencia_pedidos || [],
        platillos_top: datos.platillos_top || [],
        alertas_pedidos: datos.alertas_pedidos || [],
      });

      const pedidosCompletados = Number(estadisticas.pedidos_completados || 0);
      const pedidosCancelados = Number(estadisticas.pedidos_cancelados || 0);
      const pedidosEnProceso = Number(estadisticas.pedidos_en_proceso || 0);

      setPedidosRealizados(pedidosCompletados + pedidosCancelados + pedidosEnProceso);
      setGananciasHoy(Number(ingresos.ingresos_totales || 0));
      setTotalEntregados(pedidosCompletados);

      const ocupadas = Number(estadisticas.mesas_ocupadas || 0);
      const libres = Number(estadisticas.mesas_libres || 0);
      const inactivas = Number(estadisticas.mesas_inactivas || 0);
      setMesasOcupadas(ocupadas);
      setTotalMesas(ocupadas + libres + inactivas);

    } catch (err) {
      console.error("Error cargando dashboard:", err);
    }

    try {
      const menuActual = await obtenerMenuDia("hoy");
      setMenuDelDia(menuActual);
    } catch {
      setMenuDelDia([]);
    }
  };

  useEffect(() => {
    cargarDashboard();
    // Refresca cada 30 segundos para ver cambios en tiempo real
    const intervalo = setInterval(cargarDashboard, 30000);
    return () => clearInterval(intervalo);
  }, []);

  // Si entramos a sección menús puede que el admin suba un nuevo menú, recargamos al volver al panel
  useEffect(() => {
    if (seccion === "panel") cargarDashboard();
  }, [seccion]);

  const porcentajeOcupadas = totalMesas > 0 ? Math.round((mesasOcupadas / totalMesas) * 100) : 0;
  const menuPlatos  = menuDelDia.filter(p => p.CategoriaId !== "4");
  const menuBebidas = menuDelDia.filter(p => p.CategoriaId === "4");
  const estadisticas = resumenDashboard.estadisticas || {};
  const ingresos = resumenDashboard.ingresos || {};
  const topPlatillos = resumenDashboard.platillos_top || [];
  const alertasPedidos = resumenDashboard.alertas_pedidos || [];
  const tendenciaPedidos = resumenDashboard.tendencia_pedidos || [];
  const formatPrecio = (precio) => `$${Number(precio).toLocaleString("es-CO")}`;
  const hoyLabel = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return(
    <div className="admin-layout-container">
      
      <aside className="sidebar-admin">
        <div className="sidebar-header">
          <h2 className="logo-mangata">MANGATA</h2>
          <p className="admin-label">ADMINISTRADOR</p>
          <div className="admin-perfil">
            <p className="admin-welcome">Bienvenido,</p>
            <p className="admin-name">{usuario?.nombre || "Admin"}</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button className={`menu-item ${seccion === "panel" ? "active" : ""}`} onClick={() => setSeccion("panel")}>Panel</button>
          <button className={`menu-item ${seccion === "empleados" ? "active" : ""}`} onClick={() => setSeccion("empleados")}>Empleados</button>
          <button className={`menu-item ${seccion === "platos" ? "active" : ""}`} onClick={() => setSeccion("platos")}>Platos</button>
          <button className={`menu-item ${seccion === "menus" ? "active" : ""}`} onClick={() => setSeccion("menus")}>Menús</button>
          <button className={`menu-item ${seccion === "pqrs" ? "active" : ""}`} onClick={() => setSeccion("pqrs")}>PQRS</button>
          <button className="menu-item">Ganancias</button>
          <button className="menu-item">Reservaciones</button>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-logout-admin" onClick={() => { localStorage.removeItem("usuario"); 
            localStorage.removeItem("paginaActual"); setPagina("login"); }}>
            CERRAR SESIÓN
          </button>
        </div>
      </aside>

      <main className="admin-content-area">
        {seccion === "panel" && (
          <div className="admin-dash-shell">
            <header className="admin-dash-header">
              <div>
                <p className="admin-dash-kicker">Centro de control</p>
                <h1 className="admin-dash-title">Dashboard Administrativo</h1>
                <p className="admin-dash-subtitle">Resumen operativo de hoy, {hoyLabel}.</p>
              </div>
            </header>

            <section className="admin-kpi-grid">
              <article className="admin-kpi-card">
                <p className="admin-kpi-label">Pedidos realizados</p>
                <p className="admin-kpi-value">{pedidosRealizados}</p>
              </article>

              <article className="admin-kpi-card">
                <p className="admin-kpi-label">Ganancias de hoy</p>
                <p className="admin-kpi-value admin-kpi-value-money">{formatPrecio(gananciasHoy)} COP</p>
              </article>

              <article className="admin-kpi-card">
                <p className="admin-kpi-label">Total entregados</p>
                <p className="admin-kpi-value">{totalEntregados}</p>
              </article>

              <article className="admin-kpi-card admin-kpi-card-soft">
                <p className="admin-kpi-label">Pedidos cancelados</p>
                <p className="admin-kpi-value">{Number(estadisticas.pedidos_cancelados || 0)}</p>
              </article>

              <article className="admin-kpi-card admin-kpi-card-soft">
                <p className="admin-kpi-label">Pedidos en proceso</p>
                <p className="admin-kpi-value">{Number(estadisticas.pedidos_en_proceso || 0)}</p>
              </article>

              <article className="admin-kpi-card admin-kpi-card-soft">
                <p className="admin-kpi-label">Ticket promedio</p>
                <p className="admin-kpi-value admin-kpi-value-money">{formatPrecio(Number(ingresos.ticket_promedio || 0))}</p>
              </article>

              <article className="admin-kpi-card admin-kpi-card-soft">
                <p className="admin-kpi-label">Demora prep. promedio</p>
                <p className="admin-kpi-value">{Number(estadisticas.promedio_demora_preparacion_min || 0).toFixed(1)}m</p>
              </article>
            </section>

            <section className="admin-dash-two-col">
              <article className="admin-panel-card">
                <div className="admin-panel-card-head">
                  <h2 className="admin-panel-card-title">Menú del día</h2>
                  <span className="admin-panel-card-chip">{menuDelDia.length} ítems</span>
                </div>

                {menuDelDia.length === 0 ? (
                  <div className="admin-empty-placeholder">
                    <p>No hay menú cargado para hoy.</p>
                    <span>Ve a la sección Menús para publicarlo.</span>
                  </div>
                ) : (
                  <div className="admin-scroll-list">
                    {menuPlatos.length > 0 && (
                      <div className="admin-list-group">
                        <p className="admin-list-group-label">Platos</p>
                        {menuPlatos.map((p) => (
                          <div key={`plato-${p.id}-${p.NombrePlato}-${p.Precio}`} className="admin-list-row">
                            <span>{p.NombrePlato}</span>
                            <strong>{formatPrecio(p.Precio)}</strong>
                          </div>
                        ))}
                      </div>
                    )}

                    {menuBebidas.length > 0 && (
                      <div className="admin-list-group">
                        <p className="admin-list-group-label">Bebidas</p>
                        {menuBebidas.map((p) => (
                          <div key={`bebida-${p.id}-${p.NombrePlato}-${p.Precio}`} className="admin-list-row">
                            <span>{p.NombrePlato}</span>
                            <strong>{formatPrecio(p.Precio)}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>

              <article className="admin-panel-card admin-panel-card-center">
                <div className="admin-panel-card-head">
                  <h2 className="admin-panel-card-title">Mesas ocupadas</h2>
                </div>

                <div className="admin-circle-progress-wrap">
                  <svg viewBox="0 0 100 100" className="admin-circle-progress-svg" aria-hidden="true">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#2f2625" strokeWidth="10" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ff7a35"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - porcentajeOcupadas / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      className="admin-circle-progress-fill"
                    />
                    <text x="50" y="55" textAnchor="middle" fill="#fff4ef" fontSize="22" fontWeight="bold">
                      {mesasOcupadas}
                    </text>
                  </svg>
                </div>

                <p className="admin-mesas-caption">{mesasOcupadas} de {totalMesas} mesas ocupadas</p>
                <p className="admin-mesas-caption-soft">Ocupación actual: {porcentajeOcupadas}%</p>
              </article>
            </section>

            <section className="admin-dash-two-col">
              <article className="admin-panel-card">
                <div className="admin-panel-card-head">
                  <h2 className="admin-panel-card-title">Top platillos</h2>
                </div>

                {topPlatillos.length === 0 ? (
                  <div className="admin-empty-placeholder">Sin datos para el rango seleccionado</div>
                ) : (
                  <div className="admin-scroll-list">
                    {topPlatillos.map((p) => (
                      <div key={`${p.platillo_id}-${p.platillo_nombre}`} className="admin-list-row">
                        <span>{p.platillo_nombre}</span>
                        <strong>{p.cantidad_vendida}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="admin-panel-card">
                <div className="admin-panel-card-head">
                  <h2 className="admin-panel-card-title">Alertas de pedidos</h2>
                </div>

                {alertasPedidos.length === 0 ? (
                  <div className="admin-empty-placeholder">No hay pedidos fuera del umbral</div>
                ) : (
                  <div className="admin-scroll-list">
                    {alertasPedidos.map((a) => (
                      <div key={a.id} className="admin-alert-row">
                        <p className="admin-alert-title">Mesa #{a.mesa_numero} · Pedido #{a.id}</p>
                        <p className="admin-alert-subtitle">{a.minutos_abierto} min abierto · {formatPrecio(a.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>

            <section className="admin-panel-card">
              <div className="admin-panel-card-head">
                <h2 className="admin-panel-card-title">Tendencia de pedidos</h2>
              </div>

              {tendenciaPedidos.length === 0 ? (
                <div className="admin-empty-placeholder">Sin tendencia para el rango seleccionado</div>
              ) : (
                <div className="admin-scroll-list admin-scroll-list-short">
                  {tendenciaPedidos.map((t) => (
                    <div key={t.fecha} className="admin-trend-row">
                      <span>{t.fecha}</span>
                      <span>OK: {t.completados}</span>
                      <span>CAN: {t.cancelados}</span>
                      <strong>TOT: {t.total}</strong>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {seccion === "empleados" && <Empleados usuario={usuario} />}
        {seccion === "platos" && <Platos />}
        {seccion === "menus" && <Menus />}
        {seccion === "pqrs" && <Pqrs usuario={usuario} />}
      </main>

    </div>
  )
}

export default Panel_Administrador;