import api, { apiPublic } from "./api";

// Obtener tipos de PQRS (sin autenticación)
export const obtenerTiposPQRS = async () => {
  try {
    const res = await apiPublic.get("/pqrs/tipos");
    return res.data?.datos || [];
  } catch (error) {
    console.error("Error al obtener tipos de PQRS:", error);
    throw error;
  }
};

// Registrar nueva PQRS (sin autenticación)
export const registrarPQRS = async (datos) => {
  try {
    const res = await apiPublic.post("/pqrs", datos);
    return res.data;
  } catch (error) {
    console.error("Error al registrar PQRS:", error);
    throw error;
  }
};

// Listar PQRS (solo admin)
export const obtenerPQRS = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.estado) params.append("estado", filtros.estado);
    if (filtros.tipo) params.append("tipo", filtros.tipo);
    if (filtros.page) params.append("page", filtros.page);
    if (filtros.limit) params.append("limit", filtros.limit);

    const res = await api.get(`/pqrs?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.error("Error al obtener PQRS:", error);
    throw error;
  }
};

// Obtener PQRS por ID (solo admin)
export const obtenerPQRSPorId = async (id) => {
  try {
    const res = await api.get(`/pqrs/${id}`);
    return res.data?.datos || res.data;
  } catch (error) {
    console.error("Error al obtener PQRS:", error);
    throw error;
  }
};

// Actualizar PQRS (solo admin, si está PENDIENTE)
export const actualizarPQRS = async (id, datos) => {
  try {
    const res = await api.put(`/pqrs/${id}`, datos);
    return res.data;
  } catch (error) {
    console.error("Error al actualizar PQRS:", error);
    throw error;
  }
};

// Cambiar estado y agregar respuesta (solo admin)
export const cambiarEstadoPQRS = async (id, estado, respuesta) => {
  try {
    const res = await api.patch(`/pqrs/${id}/estado`, {
      estado,
      respuesta,
    });
    return res.data;
  } catch (error) {
    console.error("Error al cambiar estado de PQRS:", error);
    throw error;
  }
};

// Eliminar PQRS (solo admin)
export const eliminarPQRS = async (id) => {
  try {
    const res = await api.delete(`/pqrs/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error al eliminar PQRS:", error);
    throw error;
  }
};
