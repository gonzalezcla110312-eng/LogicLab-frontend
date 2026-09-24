import { useEffect, useState } from "react";
import api from "../../services/api";

const obtenerFechaHoy = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

const RESERVACION_INICIAL = {
  nombre_cliente: "",
  telefono_cliente: "",
  email_cliente: "",
  mesa_id: "",
  fecha: obtenerFechaHoy(),
  hora: "19:00",
  personas: 2,
  observaciones: "",
};

function Reservaciones() {
  const [reservaciones, setReservaciones] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [formulario, setFormulario] = useState(RESERVACION_INICIAL);

  const [editandoId, setEditandoId] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarReservaciones = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await api.get("/reservaciones");

      setReservaciones(
        respuesta.data?.datos || []
      );
    } catch (err) {
      console.error(
        "Error cargando reservaciones:",
        err
      );

      setError(
        err.response?.data?.error ||
        "No se pudieron cargar las reservaciones."
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarMesas = async () => {
    try {
      const respuesta = await api.get("/mesas");

      const mesasDisponibles = (
        respuesta.data?.datos || []
      ).filter(
        (mesa) =>
          mesa.activa &&
          mesa.estado !== "INACTIVA"
      );

      setMesas(mesasDisponibles);
    } catch (err) {
      console.error(
        "Error cargando mesas:",
        err
      );

      setError(
        err.response?.data?.error ||
        "No se pudieron cargar las mesas."
      );
    }
  };

  useEffect(() => {
    Promise.all([
      cargarReservaciones(),
      cargarMesas(),
    ]);
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      ...RESERVACION_INICIAL,
      fecha: obtenerFechaHoy(),
    });

    setEditandoId(null);
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!formulario.nombre_cliente.trim()) {
      setError(
        "El nombre del cliente es obligatorio."
      );
      return;
    }

    if (!formulario.mesa_id) {
      setError("Debes seleccionar una mesa.");
      return;
    }

    if (!formulario.fecha) {
      setError("Debes seleccionar una fecha.");
      return;
    }

    if (!formulario.hora) {
      setError("Debes seleccionar una hora.");
      return;
    }

    if (
      !formulario.personas ||
      Number(formulario.personas) < 1
    ) {
      setError(
        "El número de personas debe ser mayor que cero."
      );
      return;
    }

    const datos = {
      ...formulario,
      mesa_id: Number(formulario.mesa_id),
      personas: Number(formulario.personas),
    };

    try {
      setGuardando(true);

      if (editandoId) {
        await api.put(
          `/reservaciones/${editandoId}`,
          datos
        );

        setMensaje(
          "Reservación actualizada correctamente."
        );
      } else {
        await api.post(
          "/reservaciones",
          datos
        );

        setMensaje(
          "Reservación creada correctamente."
        );
      }

      limpiarFormulario();
      await cargarReservaciones();
    } catch (err) {
      console.error(
        "Error guardando reservación:",
        err
      );

      const respuestaError =
        err.response?.data?.error;

      const errores =
        err.response?.data?.errores;

      if (Array.isArray(errores) && errores.length > 0) {
        setError(
          errores
            .map((item) => item.msg)
            .join(" ")
        );
      } else {
        setError(
          respuestaError ||
          "No se pudo guardar la reservación."
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  const editarReservacion = (reservacion) => {
    setError("");
    setMensaje("");

    setEditandoId(reservacion.id);

    setFormulario({
      nombre_cliente:
        reservacion.nombre_cliente || "",

      telefono_cliente:
        reservacion.telefono_cliente || "",

      email_cliente:
        reservacion.email_cliente || "",

      mesa_id:
        String(reservacion.mesa_id || ""),

      fecha:
        reservacion.fecha || obtenerFechaHoy(),

      hora:
        reservacion.hora || "19:00",

      personas:
        Number(reservacion.personas || 2),

      observaciones:
        reservacion.observaciones || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cambiarEstado = async (
    id,
    estado
  ) => {
    setError("");
    setMensaje("");

    try {
      await api.patch(
        `/reservaciones/${id}/estado`,
        { estado }
      );

      setMensaje(
        "Estado de reservación actualizado correctamente."
      );

      await cargarReservaciones();
    } catch (err) {
      console.error(
        "Error cambiando estado:",
        err
      );

      setError(
        err.response?.data?.error ||
        "No se pudo actualizar el estado."
      );
    }
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
    setError("");
    setMensaje("");
  };

  const obtenerTextoEstado = (estado) => {
    switch (estado) {
      case "PENDIENTE":
        return "Pendiente";

      case "CONFIRMADA":
        return "Confirmada";

      case "CANCELADA":
        return "Cancelada";

      case "ATENDIDA":
        return "Atendida";

      default:
        return estado;
    }
  };

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case "CONFIRMADA":
        return "#7bd88f";

      case "CANCELADA":
        return "#ff7676";

      case "ATENDIDA":
        return "#7ec8ff";

      default:
        return "#ffc857";
    }
  };

  return (
    <div className="admin-dash-shell">

      <header className="admin-dash-header">
        <div>
          <p className="admin-dash-kicker">
            Gestión del restaurante
          </p>

          <h1 className="admin-dash-title">
            Reservaciones
          </h1>

          <p className="admin-dash-subtitle">
            Administración de reservas del restaurante.
          </p>
        </div>
      </header>

      {error && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#5a1f1f",
            border: "1px solid #b84c4c",
            color: "#ffdede",
          }}
        >
          {error}
        </div>
      )}

      {mensaje && (
        <div
          style={{
            marginBottom: "20px",
            padding: "14px 18px",
            borderRadius: "10px",
            background: "#173d29",
            border: "1px solid #3d9b64",
            color: "#d8ffe5",
          }}
        >
          {mensaje}
        </div>
      )}

      <section className="admin-panel-card">
        <div className="admin-panel-card-head">
          <h2 className="admin-panel-card-title">
            {editandoId
              ? "Editar reservación"
              : "Nueva reservación"}
          </h2>
        </div>

        <form
          onSubmit={manejarGuardar}
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >

          <div>
            <label>Nombre del cliente</label>

            <input
              type="text"
              name="nombre_cliente"
              value={formulario.nombre_cliente}
              onChange={manejarCambio}
              placeholder="Nombre completo"
              maxLength={120}
              style={estiloInput}
            />
          </div>

          <div>
            <label>Teléfono</label>

            <input
              type="text"
              name="telefono_cliente"
              value={formulario.telefono_cliente}
              onChange={manejarCambio}
              placeholder="Teléfono"
              maxLength={30}
              style={estiloInput}
            />
          </div>

          <div>
            <label>Correo electrónico</label>

            <input
              type="email"
              name="email_cliente"
              value={formulario.email_cliente}
              onChange={manejarCambio}
              placeholder="correo@ejemplo.com"
              style={estiloInput}
            />
          </div>

          <div>
            <label>Mesa</label>

            <select
              name="mesa_id"
              value={formulario.mesa_id}
              onChange={manejarCambio}
              style={estiloInput}
            >
              <option value="">
                Seleccionar mesa
              </option>

              {mesas.map((mesa) => (
                <option
                  key={mesa.id}
                  value={mesa.id}
                >
                  Mesa #{mesa.numero}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Fecha</label>

            <input
              type="date"
              name="fecha"
              value={formulario.fecha}
              min={obtenerFechaHoy()}
              onChange={manejarCambio}
              style={estiloInput}
            />
          </div>

          <div>
            <label>Hora</label>

            <input
              type="time"
              name="hora"
              value={formulario.hora}
              onChange={manejarCambio}
              style={estiloInput}
            />
          </div>

          <div>
            <label>Número de personas</label>

            <input
              type="number"
              name="personas"
              value={formulario.personas}
              onChange={manejarCambio}
              min="1"
              max="50"
              style={estiloInput}
            />
          </div>

          <div>
            <label>Observaciones</label>

            <input
              type="text"
              name="observaciones"
              value={formulario.observaciones}
              onChange={manejarCambio}
              placeholder="Observaciones"
              maxLength={255}
              style={estiloInput}
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "8px",
            }}
          >
            <button
              type="submit"
              disabled={guardando}
              style={estiloBotonPrincipal}
            >
              {guardando
                ? "Guardando..."
                : editandoId
                  ? "Actualizar reservación"
                  : "Crear reservación"}
            </button>

            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                style={estiloBotonSecundario}
              >
                Cancelar edición
              </button>
            )}
          </div>

        </form>
      </section>

      <section
        className="admin-panel-card"
        style={{ marginTop: "24px" }}
      >

        <div className="admin-panel-card-head">
          <h2 className="admin-panel-card-title">
            Reservaciones registradas
          </h2>

          <span className="admin-panel-card-chip">
            {reservaciones.length} reservas
          </span>
        </div>

        {cargando ? (
          <div className="admin-empty-placeholder">
            <p>Cargando reservaciones...</p>
          </div>
        ) : reservaciones.length === 0 ? (
          <div className="admin-empty-placeholder">
            <p>
              No hay reservaciones registradas.
            </p>

            <span>
              Crea la primera reservación utilizando el formulario.
            </span>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  <th style={estiloTh}>Cliente</th>
                  <th style={estiloTh}>Mesa</th>
                  <th style={estiloTh}>Fecha</th>
                  <th style={estiloTh}>Hora</th>
                  <th style={estiloTh}>Personas</th>
                  <th style={estiloTh}>Estado</th>
                  <th style={estiloTh}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {reservaciones.map((reservacion) => (
                  <tr key={reservacion.id}>

                    <td style={estiloTd}>
                      <strong>
                        {reservacion.nombre_cliente}
                      </strong>

                      {reservacion.telefono_cliente && (
                        <div
                          style={{
                            fontSize: "12px",
                            opacity: 0.75,
                            marginTop: "4px",
                          }}
                        >
                          {reservacion.telefono_cliente}
                        </div>
                      )}

                      {reservacion.email_cliente && (
                        <div
                          style={{
                            fontSize: "12px",
                            opacity: 0.75,
                          }}
                        >
                          {reservacion.email_cliente}
                        </div>
                      )}
                    </td>

                    <td style={estiloTd}>
                      Mesa #{reservacion.mesa_numero}
                    </td>

                    <td style={estiloTd}>
                      {reservacion.fecha}
                    </td>

                    <td style={estiloTd}>
                      {reservacion.hora}
                    </td>

                    <td style={estiloTd}>
                      {reservacion.personas}
                    </td>

                    <td style={estiloTd}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "6px 10px",
                          borderRadius: "20px",
                          background:
                            obtenerColorEstado(
                              reservacion.estado
                            ),
                          color: "#1b1210",
                          fontWeight: "700",
                          fontSize: "12px",
                        }}
                      >
                        {obtenerTextoEstado(
                          reservacion.estado
                        )}
                      </span>
                    </td>

                    <td style={estiloTd}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px",
                        }}
                      >

                        <button
                          type="button"
                          onClick={() =>
                            editarReservacion(
                              reservacion
                            )
                          }
                          style={estiloBotonPequeno}
                        >
                          Editar
                        </button>

                        {reservacion.estado ===
                          "PENDIENTE" && (
                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstado(
                                reservacion.id,
                                "CONFIRMADA"
                              )
                            }
                            style={estiloBotonPequeno}
                          >
                            Confirmar
                          </button>
                        )}

                        {reservacion.estado ===
                          "CONFIRMADA" && (
                          <button
                            type="button"
                            onClick={() =>
                              cambiarEstado(
                                reservacion.id,
                                "ATENDIDA"
                              )
                            }
                            style={estiloBotonPequeno}
                          >
                            Atendida
                          </button>
                        )}

                        {reservacion.estado !==
                          "CANCELADA" &&
                          reservacion.estado !==
                            "ATENDIDA" && (
                            <button
                              type="button"
                              onClick={() =>
                                cambiarEstado(
                                  reservacion.id,
                                  "CANCELADA"
                                )
                              }
                              style={{
                                ...estiloBotonPequeno,
                                background:
                                  "#7f2424",
                              }}
                            >
                              Cancelar
                            </button>
                          )}

                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </section>
    </div>
  );
}

const estiloInput = {
  width: "100%",
  boxSizing: "border-box",
  marginTop: "7px",
  padding: "11px 13px",
  borderRadius: "8px",
  border: "1px solid #714132",
  background: "#241614",
  color: "#fff4ef",
  fontSize: "14px",
};

const estiloBotonPrincipal = {
  border: "none",
  borderRadius: "8px",
  padding: "12px 20px",
  background: "#ff6a2a",
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
};

const estiloBotonSecundario = {
  border: "1px solid #714132",
  borderRadius: "8px",
  padding: "12px 20px",
  background: "#2a1a17",
  color: "#fff4ef",
  fontWeight: "700",
  cursor: "pointer",
};

const estiloBotonPequeno = {
  border: "none",
  borderRadius: "6px",
  padding: "7px 10px",
  background: "#ff6a2a",
  color: "#ffffff",
  fontWeight: "600",
  cursor: "pointer",
  fontSize: "12px",
};

const estiloTh = {
  textAlign: "left",
  padding: "12px 10px",
  borderBottom: "1px solid #714132",
  color: "#ffb08a",
  fontSize: "13px",
};

const estiloTd = {
  padding: "12px 10px",
  borderBottom: "1px solid #3d2925",
  color: "#fff4ef",
  verticalAlign: "top",
};

export default Reservaciones;