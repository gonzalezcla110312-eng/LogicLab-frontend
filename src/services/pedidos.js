import api from "./api";

export const CATEGORIAS = [
  { id: 1, nombre: "Carta Corriente" },
  { id: 2, nombre: "Comida Rapida" },
  { id: 3, nombre: "Carta Especial" },
  { id: 4, nombre: "Bebidas" },
];

const normalizarEstadoPedido = (estado = "") => String(estado).toUpperCase();

export const normalizarDetalle = (detalle) => {
  const categoriaId = detalle?.platillo?.categoria_id || detalle?.categoria_id || 0;
  return {
    id: detalle.id,
    PedidoId: detalle.pedido_id,
    PlatoId: detalle.platillo_id,
    NombrePlato: detalle?.platillo?.nombre || `Platillo #${detalle.platillo_id}`,
    cantidadPedido: Number(detalle.cantidad || 0),
    notasEspeciales: detalle.notas || "",
    CategoriaId: String(categoriaId),
    precioFinal: Number(detalle.subtotal || 0),
  };
};

export const normalizarPedido = (pedido) => {
  const detalles = (pedido.detalles || []).map(normalizarDetalle);
  return {
    id: pedido.id,
    mesa: pedido.mesa_id,
    mesa_id: pedido.mesa_id,
    fecha_pedido: pedido.created_at,
    estadoPedido: normalizarEstadoPedido(pedido.estado),
    totalPagar: Number(pedido.total || 0),
    detalles,
    platos: detalles.filter((d) => d.CategoriaId !== "4"),
    bebidas: detalles.filter((d) => d.CategoriaId === "4"),
  };
};

export const obtenerMesas = async () => {
  const res = await api.get("/mesas");
  return res.data?.datos || [];
};

export const obtenerPedidosDeMesa = async (mesaId) => {
  const res = await api.get(`/mesas/${mesaId}/pedidos`);
  return (res.data?.datos || []).map(normalizarPedido);
};

export const obtenerTodosLosPedidos = async () => {
  const mesas = await obtenerMesas();
  const pedidosPorMesa = await Promise.all(
    mesas.map((mesa) => obtenerPedidosDeMesa(mesa.id).catch(() => []))
  );
  return pedidosPorMesa.flat();
};

// Cambiar estado del pedido (COCINANDO, PARA_ENTREGA, ENTREGADO, PAGADO, CERRADO, CANCELADO)
export const cambiarEstadoPedido = async (pedidoId, estado) => {
  const res = await api.patch(`/mesas/pedidos/${pedidoId}/estado`, { estado });
  return res.data?.datos || null;
};

// Actualizar pedido existente (reemplazar items completos)
export const actualizarPedido = async (pedidoId, items) => {
  const res = await api.put(`/mesas/pedidos/${pedidoId}`, { items });
  return res.data?.datos || null;
};

// Liberar mesa manualmente
export const liberarMesa = async (mesaId) => {
  const res = await api.patch(`/mesas/${mesaId}/liberar`);
  return res.data?.datos || null;
};
