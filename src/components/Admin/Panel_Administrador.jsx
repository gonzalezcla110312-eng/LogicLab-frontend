import { useState, useEffect } from "react"
import Empleados from './Empleados'
import Platos from './Platos'
import Menus from './Menus'
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
          <div className="dashboard-grid">
            <div className="stats-row">
              <div className="stat-card">
                <h3>Pedidos Realizados</h3>
                <p className="stat-number">{pedidosRealizados}</p>
              </div>
              <div className="stat-card">
                <h3>Ganancias de hoy</h3>
                <p className="stat-number">{formatPrecio(gananciasHoy)} COP</p>
              </div>
              <div className="stat-card">
                <h3>Total Entregados</h3>
                <p className="stat-number">{totalEntregados}</p>
              </div>
            </div>

            <div className="stats-row stats-row-extended">
              <div className="stat-card">
                <h3>Pedidos Cancelados</h3>
                <p className="stat-number">{Number(estadisticas.pedidos_cancelados || 0)}</p>
              </div>
              <div className="stat-card">
                <h3>En Proceso</h3>
                <p className="stat-number">{Number(estadisticas.pedidos_en_proceso || 0)}</p>
              </div>
              <div className="stat-card">
                <h3>Ticket Promedio</h3>
                <p className="stat-number" style={{ fontSize: "1.7rem" }}>
                  {formatPrecio(Number(ingresos.ticket_promedio || 0))}
                </p>
              </div>
              <div className="stat-card">
                <h3>Demora Prep. Prom</h3>
                <p className="stat-number">{Number(estadisticas.promedio_demora_preparacion_min || 0).toFixed(1)}m</p>
              </div>
            </div>

            <div className="main-stats-row">

              {/* ── MENU DEL DIA ── */}
              <div className="info-box menu-dia">
                <h2>MENU DEL DIA</h2>
                {menuDelDia.length === 0 ? (
                  <div className="empty-placeholder">
                    <p>Menú {`{Hoy}`}</p>
                    <span>Sin platos asignados — ve a <strong>Menús</strong> para armar el menú</span>
                  </div>
                ) : (
                  <div style={{ overflowY: "auto", maxHeight: "260px", paddingRight: "4px" }}>
                    {menuPlatos.length > 0 && (
                      <div style={{ marginBottom: "0.5rem" }}>
                        <p style={{ color: "#e87d2a", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.3rem" }}>PLATOS</p>
                        {menuPlatos.map((p, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "0.85rem" }}>
                            <span style={{ color: "#eee" }}>{p.NombrePlato}</span>
                            <span style={{ color: "#e87d2a", fontWeight: "600" }}>{formatPrecio(p.Precio)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {menuBebidas.length > 0 && (
                      <div>
                        <p style={{ color: "#e87d2a", fontSize: "0.8rem", fontWeight: "700", marginBottom: "0.3rem" }}>BEBIDAS</p>
                        {menuBebidas.map((p, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "0.85rem" }}>
                            <span style={{ color: "#eee" }}>{p.NombrePlato}</span>
                            <span style={{ color: "#e87d2a", fontWeight: "600" }}>{formatPrecio(p.Precio)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p style={{ color: "#888", fontSize: "0.75rem", marginTop: "0.5rem", textAlign: "right" }}>
                      {menuDelDia.length} ítems en el menú
                    </p>
                  </div>
                )}
              </div>

              {/* ── MESAS OCUPADAS ── */}
              <div className="info-box mesas-ocupadas">
                <h2>Mesas Ocupadas</h2>
                <div className="circle-progress">
                  <svg viewBox="0 0 100 100" style={{ width: "120px", height: "120px" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#333" strokeWidth="10"/>
                    <circle
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke="#e87d2a"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - porcentajeOcupadas / 100)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                    <text x="50" y="55" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">
                      {mesasOcupadas}
                    </text>
                  </svg>
                </div>
                <p>Mesas ocupadas</p>
                <p style={{ color: "#888", fontSize: "0.8rem" }}>{mesasOcupadas} de {totalMesas} ({porcentajeOcupadas}%)</p>
              </div>
            </div>

            <div className="main-stats-row">
              <div className="info-box">
                <h2>Top Platillos</h2>
                {topPlatillos.length === 0 ? (
                  <div className="empty-placeholder">Sin datos para el rango seleccionado</div>
                ) : (
                  <div style={{ maxHeight: "220px", overflowY: "auto", textAlign: "left" }}>
                    {topPlatillos.map((p, i) => (
                      <div key={`${p.platillo_id}-${i}`} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "8px 0" }}>
                        <span>{p.platillo_nombre}</span>
                        <span style={{ color: "#e87d2a", fontWeight: 700 }}>{p.cantidad_vendida}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="info-box">
                <h2>Alertas Pedidos</h2>
                {alertasPedidos.length === 0 ? (
                  <div className="empty-placeholder">No hay pedidos abiertos fuera del umbral</div>
                ) : (
                  <div style={{ maxHeight: "220px", overflowY: "auto", textAlign: "left" }}>
                    {alertasPedidos.map((a) => (
                      <div key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "8px 0" }}>
                        <div style={{ fontWeight: 700 }}>Mesa #{a.mesa_numero}</div>
                        <div style={{ color: "#bbb", fontSize: "0.85rem" }}>
                          Pedido #{a.id} · {a.minutos_abierto} min abierto · {formatPrecio(a.total)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="info-box">
              <h2>Tendencia Pedidos</h2>
              {tendenciaPedidos.length === 0 ? (
                <div className="empty-placeholder">Sin tendencia para el rango seleccionado</div>
              ) : (
                <div style={{ maxHeight: "180px", overflowY: "auto", textAlign: "left" }}>
                  {tendenciaPedidos.map((t) => (
                    <div key={t.fecha} style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "8px 0" }}>
                      <span>{t.fecha}</span>
                      <span>OK: {t.completados}</span>
                      <span>CAN: {t.cancelados}</span>
                      <span>TOT: {t.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {seccion === "empleados" && <Empleados usuario={usuario} />}
        {seccion === "platos" && <Platos />}
        {seccion === "menus" && <Menus />}
      </main>

    </div>
  )
}

export default Panel_Administrador;