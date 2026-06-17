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

function MenuMesero({ usuario, setPagina }) {
  const [menuDelDia, setMenuDelDia] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState("");
  const getPlatoId = (plato) => plato?.platillo_id ?? plato?.id;
  const [cantidades, setCantidades] = useState({});
  const [notas, setNotas] = useState({});
  const [carrito, setCarrito] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [editandoPedidoId, setEditandoPedidoId] = useState(null);
  const [cargandoPedido, setCargandoPedido] = useState(false);

  const usuarioActivo = usuario || JSON.parse(localStorage.getItem("usuario") || "null");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [menu, resMesas] = await Promise.all([
          obtenerMenuDia("hoy"),
          api.get("/mesas"),
        ]);

        setMenuDelDia(menu || []);
        const mesasData = resMesas.data?.datos || [];
        setMesas(mesasData);

        const mesaGuardada = localStorage.getItem("mesaSeleccionadaId");
        if (mesaGuardada) {
          setMesaSeleccionadaId(String(mesaGuardada));
        }

        // Cargar pedido existente si se está editando
        const pedidoIdEditar = localStorage.getItem("pedidoIdEditar");
        if (pedidoIdEditar && menu && menu.length > 0) {
          try {
            const resPedido = await api.get(`/mesas/pedidos/${pedidoIdEditar}`);
            const pedidoData = resPedido.data?.datos || {};
            
            if (pedidoData.detalles && Array.isArray(pedidoData.detalles)) {
              const itemsCarrito = pedidoData.detalles.map((d) => {
                const platoEnMenu = menu.find((p) => getPlatoId(p) === d.platillo_id);
                return {
                  plato: platoEnMenu || { platillo_id: d.platillo_id, NombrePlato: d.platillo_nombre, Precio: 0, Descripcion: "", CategoriaId: "" },
                  cantidad: d.cantidad,
                  nota: d.notas || "",
                };
              });
              setCarrito(itemsCarrito);
              setEditandoPedidoId(pedidoIdEditar);
            }
          } catch (errPedido) {
            console.error("Error cargando pedido:", errPedido);
          } finally {
            localStorage.removeItem("pedidoIdEditar");
          }
        }
      } catch (error) {
        console.error("Error cargando menu y mesas:", error);
      }
    };

    cargarDatos();
  }, []);

  const mesaSeleccionada = useMemo(
    () => mesas.find((m) => String(m.id) === String(mesaSeleccionadaId)),
    [mesas, mesaSeleccionadaId]
  );

  const getCantidad = (id) => cantidades[id] || 1;
  const getNota = (id) => notas[id] || "";

  const cambiarCantidad = (id, valor) => {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + valor) }));
  };

  const enCarrito = (platilloId) => carrito.some((i) => getPlatoId(i.plato) === platilloId);

  const toggleCarrito = (plato) => {
    const platilloId = getPlatoId(plato);
    if (enCarrito(platilloId)) {
      setCarrito((prev) => prev.filter((i) => getPlatoId(i.plato) !== platilloId));
      return;
    }

    setCarrito((prev) => [
      ...prev,
      {
        plato,
        cantidad: getCantidad(platilloId),
        nota: getNota(platilloId),
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

  const actualizarNota = (id, valor) => {
    setNotas((prev) => ({ ...prev, [id]: valor }));
    setCarrito((prev) =>
      prev.map((item) =>
        getPlatoId(item.plato) === id
          ? {
              ...item,
              nota: valor,
            }
          : item
      )
    );
  };

  const crearOActualizarPedido = async () => {
    if (!mesaSeleccionada) {
      alert("Selecciona una mesa para crear el pedido.");
      return;
    }

    if (!usuarioActivo?.id) {
      alert("No se encontró el usuario autenticado.");
      return;
    }

    if (carrito.length === 0) {
      alert("Agrega al menos un producto al pedido.");
      return;
    }

    setEnviando(true);
    try {
      const items = carrito.map((item) => ({
        platillo_id: Number(getPlatoId(item.plato)),
        cantidad: Number(item.cantidad),
        ...(item.nota?.trim() ? { notas: item.nota.trim() } : {}),
      }));

      if (editandoPedidoId) {
        // Actualizar pedido existente con nuevo endpoint PUT
        await actualizarPedido(editandoPedidoId, items);
        alert(`Pedido actualizado para Mesa #${mesaSeleccionada.numero}`);
      } else {
        // Crear nuevo pedido
        const payload = {
          usuario_id: Number(usuarioActivo.id),
          items,
        };
        await api.post(`/mesas/${mesaSeleccionada.id}/pedidos`, payload);
        alert(`Pedido creado en estado PENDIENTE para Mesa #${mesaSeleccionada.numero}`);
      }
      
      setCarrito([]);
      setCantidades({});
      setNotas({});
      setEditandoPedidoId(null);
      setPagina("mesero");
    } catch (error) {
      console.error("Error:", error);
      alert(error.response?.data?.error || "No se pudo procesar el pedido");
    } finally {
      setEnviando(false);
    }
  };

  const formatPrecio = (precio) => `$${Number(precio).toLocaleString("es-CO")}`;

  return (
    <div className="vc-container">
      <header className="vc-header">
        <span className="vc-badge-mesa">
          {mesaSeleccionada ? `Mesa #${mesaSeleccionada.numero}` : "Selecciona mesa"}
        </span>
        <div className="vc-header-center">
          <h1 className="vc-logo">Menu Mesero</h1>
          <p className="vc-menu-dia-label">Crear Pedido</p>
        </div>
        <button className="vc-btn-salir" onClick={() => setPagina("mesero")}>VOLVER</button>
      </header>

      <section className="vc-seccion" style={{ paddingTop: "0.75rem" }}>
        <h2 className="vc-seccion-titulo">Mesa</h2>
        <select
          value={mesaSeleccionadaId}
          onChange={(e) => {
            setMesaSeleccionadaId(e.target.value);
            localStorage.setItem("mesaSeleccionadaId", e.target.value);
          }}
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "0.7rem 0.9rem",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(0,0,0,0.25)",
            color: "#fff",
          }}
        >
          <option value="">-- Elige tu Mesa --</option>
          {mesas
            .filter((m) => m.estado === "LIBRE")
            .map((m) => (
              <option key={m.id} value={m.id}>
                Mesa #{m.numero}
              </option>
            ))}
        </select>
      </section>

      <section className="vc-seccion">
        <h2 className="vc-seccion-titulo">Productos del Menu</h2>
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
                      <div className="vc-tarjeta-cantidad">
                        <button className="vc-cant-btn" onClick={() => cambiarCantidad(platilloId, -1)}>−</button>
                        <span className="vc-cant-num">{getCantidad(platilloId)}</span>
                        <button className="vc-cant-btn" onClick={() => cambiarCantidad(platilloId, 1)}>+</button>
                      </div>
                      <button
                        className={`vc-tarjeta-btn ${agregado ? "vc-tarjeta-btn-quitar" : ""}`}
                        onClick={() => toggleCarrito(plato)}
                      >
                        {agregado ? "Quitar" : "Agregar"}
                      </button>
                    </div>

                    <input
                      className="vc-tarjeta-peticion-input"
                      type="text"
                      placeholder="Notas para cocina (opcional)"
                      value={getNota(platilloId)}
                      onChange={(e) => actualizarNota(platilloId, e.target.value)}
                      style={{ marginTop: "0.7rem" }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {carrito.length > 0 && (
        <section className="vc-pedido">
          <h2 className="vc-pedido-titulo">
            {editandoPedidoId ? "✏️ Editar Pedido" : "Resumen del Pedido"}
          </h2>
          {carrito.map((item) => (
            <div
              key={getPlatoId(item.plato)}
              className="vc-pedido-item"
              style={{
                background: editandoPedidoId ? "rgba(59, 130, 246, 0.1)" : "inherit",
                borderLeft: editandoPedidoId ? "4px solid #3b82f6" : "inherit",
                paddingLeft: editandoPedidoId ? "0.75rem" : "inherit",
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

                {/* Cantidad editable */}
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

                {/* Notas editables */}
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
              <span>Total:</span>
              <span>{formatPrecio(carrito.reduce((sum, item) => sum + item.plato.Precio * item.cantidad, 0))}</span>
            </div>

            <button className="vc-btn-enviar" onClick={crearOActualizarPedido} disabled={enviando || cargandoPedido}>
              {enviando ? (editandoPedidoId ? "Actualizando..." : "Creando...") : (editandoPedidoId ? "✏️ Actualizar Pedido" : "✓ Crear Pedido (PENDIENTE)")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default MenuMesero;
