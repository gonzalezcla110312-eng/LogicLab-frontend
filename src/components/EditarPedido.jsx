import { useEffect, useMemo, useState } from "react";
import api, { construirUrlImagen } from "../services/api";
import { obtenerMenuDia } from "../services/menuDia";
import { actualizarPedido } from "../services/pedidos";
import "../styles/Cliente.css";
import "../App.css";

const IMG_CATEGORIA = {
  "1": "/CartaCorriente.png",
  "2": "/CartaComidaRapida.png",
  "3": "/CartaEspecial.png",
  "4": "/CartaBebidas.png",
};

function EditarPedido({ usuario, setPagina }) {
  const [menuDelDia, setMenuDelDia] = useState([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [pedidoActual, setPedidoActual] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [pedidoId, setPedidoId] = useState(null);

  const getPlatoId = (plato) => plato?.platillo_id ?? plato?.id;

  const usuarioActivo = usuario || JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        // Obtener menú del día
        const menu = await obtenerMenuDia("hoy");
        setMenuDelDia(menu || []);

        // Obtener datos guardados en localStorage
        const mesaId = localStorage.getItem("mesaSeleccionadaId");
        const pedidoIdEditar = localStorage.getItem("pedidoIdEditar");

        if (!mesaId || !pedidoIdEditar) {
          alert("No se encontró la información necesaria.");
          setPagina("mesero");
          return;
        }

        setPedidoId(pedidoIdEditar);

        // Cargar información de la mesa
        const resMesas = await api.get("/mesas");
        const mesas = resMesas.data?.datos || [];
        const mesa = mesas.find((m) => String(m.id) === String(mesaId));
        setMesaSeleccionada(mesa);

        // Cargar pedido actual
        const resPedido = await api.get(`/mesas/pedidos/${pedidoIdEditar}`);
        const pedido = resPedido.data?.datos || {};
        setPedidoActual(pedido);

        // Mapear detalles actuales al carrito
        if (pedido.detalles && Array.isArray(pedido.detalles)) {
          const itemsCarrito = pedido.detalles.map((d) => {
            const platoEnMenu = menu.find((p) => getPlatoId(p) === d.platillo_id);
            return {
              plato: platoEnMenu || {
                platillo_id: d.platillo_id,
                NombrePlato: d.platillo_nombre,
                Precio: 0,
                Descripcion: "",
                CategoriaId: "",
              },
              cantidad: d.cantidad,
              nota: d.notas || "",
            };
          });
          setCarrito(itemsCarrito);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("Error al cargar el pedido.");
        setPagina("mesero");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const enCarrito = (platilloId) => carrito.some((i) => getPlatoId(i.plato) === platilloId);

  const agregarAlCarrito = (plato) => {
    const platilloId = getPlatoId(plato);
    if (enCarrito(platilloId)) return;
    setCarrito((prev) => [
      ...prev,
      {
        plato,
        cantidad: 1,
        nota: "",
      },
    ]);
  };

  const removerDelCarrito = (platilloId) => {
    setCarrito((prev) => prev.filter((i) => getPlatoId(i.plato) !== platilloId));
  };

  const actualizarCantidadCarrito = (platilloId, cantidad) => {
    if (cantidad < 1) return;
    setCarrito((prev) =>
      prev.map((item) =>
        getPlatoId(item.plato) === platilloId
          ? { ...item, cantidad: Math.max(1, cantidad) }
          : item
      )
    );
  };

  const actualizarNotaCarrito = (platilloId, nota) => {
    setCarrito((prev) =>
      prev.map((item) =>
        getPlatoId(item.plato) === platilloId
          ? { ...item, nota }
          : item
      )
    );
  };

  const guardarEdicion = async () => {
    if (!pedidoId) {
      alert("No se encontró el ID del pedido.");
      return;
    }

    if (carrito.length === 0) {
      alert("El pedido debe tener al menos un producto.");
      return;
    }

    setEnviando(true);
    try {
      const items = carrito.map((item) => ({
        platillo_id: Number(getPlatoId(item.plato)),
        cantidad: Number(item.cantidad),
        ...(item.nota?.trim() ? { notas: item.nota.trim() } : {}),
      }));

      await actualizarPedido(pedidoId, items);
      alert("Pedido actualizado correctamente.");
      localStorage.removeItem("pedidoIdEditar");
      localStorage.removeItem("mesaSeleccionadaId");
      setPagina("mesero");
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.error || "No se pudo actualizar el pedido.");
    } finally {
      setEnviando(false);
    }
  };

  const formatPrecio = (precio) => `$${Number(precio).toLocaleString("es-CO")}`;
  const totalCarrito = carrito.reduce((sum, item) => sum + item.plato.Precio * item.cantidad, 0);

  if (cargando) {
    return (
      <div className="vc-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "1.2rem", color: "#fff" }}>Cargando pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-container">
      <header className="vc-header">
        <span className="vc-badge-mesa">
          {mesaSeleccionada ? `Mesa #${mesaSeleccionada.numero}` : "Cargando..."}
        </span>
        <div className="vc-header-center">
          <h1 className="vc-logo">✏️ Editar Pedido</h1>
          <p className="vc-menu-dia-label">
            {pedidoActual?.id ? `Pedido #${pedidoActual.id}` : ""}
          </p>
        </div>
        <button className="vc-btn-salir" onClick={() => setPagina("mesero")}>VOLVER</button>
      </header>

      <section className="vc-seccion">
        <h2 className="vc-seccion-titulo">Información Actual</h2>
        <div style={{
          background: "rgba(255,255,255,0.08)",
          padding: "1rem",
          borderRadius: "12px",
          marginBottom: "1rem",
        }}>
          <p><strong>Estado:</strong> {pedidoActual?.estado || "N/A"}</p>
          <p><strong>Total Actual:</strong> {formatPrecio(pedidoActual?.total || 0)}</p>
          <p style={{ fontSize: "0.9rem", color: "#aaa" }}>
            Items: {pedidoActual?.detalles?.length || 0}
          </p>
        </div>
      </section>

      <section className="vc-seccion">
        <h2 className="vc-seccion-titulo">Productos Disponibles</h2>
        <div className="vc-grid">
          {menuDelDia.map((plato) => {
            const platilloId = getPlatoId(plato);
            const agregado = enCarrito(platilloId);
            const imagen = construirUrlImagen(plato.imagen_url) || (IMG_CATEGORIA[plato.CategoriaId] ?? "/CartaCorriente.png");
            return (
              <div key={platilloId} className={`vc-tarjeta ${agregado ? "vc-tarjeta-agregada" : ""}`}>
                <div className="vc-tarjeta-fila">
                  <div className="vc-tarjeta-img-wrap">
                    <img src={imagen} alt={plato.NombrePlato} className="vc-tarjeta-img" />
                  </div>
                  <div className="vc-tarjeta-body">
                    <p className="vc-tarjeta-nombre">{plato.NombrePlato}</p>
                    <p className="vc-tarjeta-desc">{plato.Descripcion}</p>
                    <p className="vc-tarjeta-precio">{formatPrecio(plato.Precio)}</p>

                    <div className="vc-tarjeta-bottom">
                      <button
                        className={`vc-tarjeta-btn ${agregado ? "vc-tarjeta-btn-quitar" : ""}`}
                        onClick={() => {
                          if (agregado) {
                            removerDelCarrito(platilloId);
                          } else {
                            agregarAlCarrito(plato);
                          }
                        }}
                      >
                        {agregado ? "Quitar" : "Agregar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {carrito.length > 0 && (
        <section className="vc-pedido">
          <h2 className="vc-pedido-titulo">📋 Items en Edición</h2>
          {carrito.map((item) => (
            <div
              key={getPlatoId(item.plato)}
              className="vc-pedido-item"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                borderLeft: "4px solid #3b82f6",
                paddingLeft: "0.75rem",
              }}
            >
              <div className="vc-pedido-item-info" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span className="vc-pedido-nombre">{item.plato.NombrePlato}</span>
                  <button
                    onClick={() => removerDelCarrito(getPlatoId(item.plato))}
                    style={{
                      background: "#ef4444",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.4rem 0.8rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                    }}
                  >
                    ✕ Quitar
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "#bbb" }}>Cantidad:</span>
                  <button
                    onClick={() => actualizarCantidadCarrito(getPlatoId(item.plato), item.cantidad - 1)}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: "30px", textAlign: "center", fontWeight: "bold" }}>
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidadCarrito(getPlatoId(item.plato), item.cantidad + 1)}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.3rem 0.6rem",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    +
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Notas para cocina (opcional)"
                  value={item.nota}
                  onChange={(e) => actualizarNotaCarrito(getPlatoId(item.plato), e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(0,0,0,0.25)",
                    color: "white",
                    fontSize: "0.85rem",
                  }}
                />

                {item.nota && (
                  <span className="vc-pedido-peticion" style={{ marginTop: "0.3rem", display: "block" }}>
                    → {item.nota}
                  </span>
                )}
              </div>

              <div className="vc-pedido-item-right">
                <span className="vc-pedido-precio" style={{ whiteSpace: "nowrap" }}>
                  {formatPrecio(item.plato.Precio * item.cantidad)}
                </span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.1rem", fontWeight: "bold" }}>
              <span>Total Nuevo:</span>
              <span>{formatPrecio(totalCarrito)}</span>
            </div>

            <div style={{ display: "flex", gap: "0.8rem" }}>
              <button
                className="vc-btn-enviar"
                onClick={() => setPagina("mesero")}
                disabled={enviando}
                style={{ background: "#6b7280", flex: 1 }}
              >
                Cancelar
              </button>
              <button
                className="vc-btn-enviar"
                onClick={guardarEdicion}
                disabled={enviando}
                style={{ flex: 1 }}
              >
                {enviando ? "Guardando..." : "✏️ Guardar Cambios"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default EditarPedido;
