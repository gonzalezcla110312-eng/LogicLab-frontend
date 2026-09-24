import api, { apiPublic } from "./api";

const MENU_DIA_BASE_PATH = import.meta.env.VITE_MENU_DIA_BASE_PATH || "/menu-dia";

export const fechaHoyISO = () => {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, "0");
  const day = String(hoy.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizarItemMenu = (item, index = 0) => {
  const platillo = item?.platillo || item;
  return {
    id: platillo.id || item.platillo_id,
    platillo_id: item.platillo_id || platillo.id,
    NombrePlato: platillo.nombre || platillo.NombrePlato || "",
    Descripcion: platillo.descripcion || platillo.Descripcion || "",
    Precio: Number(platillo.precio || platillo.Precio || 0),
    CategoriaId: String(platillo.categoria_id || platillo.CategoriaId || ""),
    imagen_url: platillo.imagen_url || "",
    orden: Number(item.orden || index + 1),
  };
};

const extraerItems = (datos) => {
  if (!datos) return [];
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos.items)) return datos.items;
  if (Array.isArray(datos.menu)) return datos.menu;
  return [];
};

export const obtenerMenuDia = async (fecha = "hoy") => {
  const path = fecha === "hoy" ? `${MENU_DIA_BASE_PATH}/hoy` : `${MENU_DIA_BASE_PATH}/${fecha}`;
  const res = await apiPublic.get(path);
  const items = extraerItems(res.data?.datos);
  return items.map(normalizarItemMenu);
};

export const guardarMenuDia = async ({ fecha = fechaHoyISO(), items = [], publicado = true }) => {
  const payload = {
    fecha,
    items: items.map((item, index) => ({
      platillo_id: item.platillo_id || item.id,
      orden: Number(item.orden || index + 1),
    })),
    publicado,
  };

  const res = await api.put(`${MENU_DIA_BASE_PATH}/${fecha}`, payload);
  const itemsGuardados = extraerItems(res.data?.datos).map(normalizarItemMenu);
  return {
    accion: res.data?.accion,
    items: itemsGuardados,
  };
};
