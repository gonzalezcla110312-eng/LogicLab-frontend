/* eslint-disable react/prop-types, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */
import { useState, useEffect } from "react";
import {
  obtenerPQRS,
  obtenerTiposPQRS,
  cambiarEstadoPQRS,
  eliminarPQRS,
} from "../../services/pqrs";
import "../../styles/Pqrs.css";

function Pqrs({ usuario }) {
  const [pqrsData, setPqrsData] = useState([]);
  const [tiposPQRS, setTiposPQRS] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedPQRS, setSelectedPQRS] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);

  // Filtros
  const [filtros, setFiltros] = useState({
    estado: "",
    tipo: "",
    page: 1,
    limit: 10,
  });

  // Modal de respuesta
  const [showRespuestaModal, setShowRespuestaModal] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [loadingRespuesta, setLoadingRespuesta] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [pqrsRes, tiposRes] = await Promise.all([
        obtenerPQRS(filtros),
        obtenerTiposPQRS(),
      ]);
      setPqrsData(pqrsRes);
      setTiposPQRS(tiposRes);
      setError("");
    } catch (err) {
      setError("Error al cargar las PQRS: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros({
      ...filtros,
      [name]: value,
      page: 1, // Reiniciar a la primera página
    });
  };

  const handleVerDetalle = (pqrs) => {
    setSelectedPQRS(pqrs);
    setShowDetalle(true);
  };

  const handleAbrirRespuesta = (pqrs) => {
    if (pqrs.estado === "PENDIENTE") {
      setNuevoEstado("EN_PROCESO");
    } else {
      setNuevoEstado(pqrs.estado);
    }
    setRespuesta(pqrs.respuesta || "");
    setSelectedPQRS(pqrs);
    setShowRespuestaModal(true);
  };

  const handleEnviarRespuesta = async () => {
    if (!nuevoEstado || !respuesta.trim()) {
      alert("Completa el estado y la respuesta");
      return;
    }

    setLoadingRespuesta(true);
    try {
      await cambiarEstadoPQRS(selectedPQRS.id, nuevoEstado, respuesta);
      alert("PQRS actualizada exitosamente");
      setShowRespuestaModal(false);
      cargarDatos();
    } catch (err) {
      alert(
        "Error al actualizar: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setLoadingRespuesta(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!globalThis.confirm("¿Estás seguro de que deseas eliminar esta PQRS?")) {
      return;
    }

    try {
      await eliminarPQRS(id);
      alert("PQRS eliminada exitosamente");
      cargarDatos();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const getEstadoClase = (estado) => {
    return `estado-${estado.toLowerCase()}`;
  };

  const getTipoInfo = (idTipo) => {
    const tipo = tiposPQRS.find((t) => t.id === idTipo);
    return tipo ? tipo.nombre : "Desconocido";
  };

  const paginaTotal = pqrsData.total
    ? Math.ceil(pqrsData.total / filtros.limit)
    : 1;

  const dataPQRS = Array.isArray(pqrsData) ? pqrsData : pqrsData.datos || [];

  return (
    <div className="pqrs-container">
      <div className="pqrs-header">
        <p className="pqrs-kicker">Módulo administrativo</p>
        <h2 className="pqrs-title">Gestión de PQRS</h2>
        <p className="pqrs-subtitle">Centraliza y responde solicitudes de clientes en tiempo real.</p>
      </div>

      {error && <div className="pqrs-alert pqrs-alert-error">{error}</div>}

      {/* Panel de Filtros */}
      <div className="pqrs-filtros">
        <div className="filtro-group">
          <label htmlFor="pqrs-estado">Estado:</label>
          <select
            id="pqrs-estado"
            name="estado"
            value={filtros.estado}
            onChange={handleFiltroChange}
            className="pqrs-filtro-input"
          >
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="RESUELTO">Resuelto</option>
            <option value="CERRADO">Cerrado</option>
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="pqrs-tipo">Tipo:</label>
          <select
            id="pqrs-tipo"
            name="tipo"
            value={filtros.tipo}
            onChange={handleFiltroChange}
            className="pqrs-filtro-input"
          >
            <option value="">Todos</option>
            {tiposPQRS.map((tipo) => (
              <option key={tipo.id} value={tipo.nombre}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label htmlFor="pqrs-limit">Registros por página:</label>
          <select
            id="pqrs-limit"
            name="limit"
            value={filtros.limit}
            onChange={handleFiltroChange}
            className="pqrs-filtro-input"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>

        <button
          onClick={cargarDatos}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? "Cargando..." : "Actualizar"}
        </button>
      </div>

      {/* Tabla de PQRS */}
      <div className="pqrs-tabla-wrapper">
        <table className="pqrs-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Cliente</th>
              <th>Email</th>
              <th>Asunto</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {dataPQRS.length > 0 ? (
              dataPQRS.map((pqrs) => (
                <tr key={pqrs.id} className="pqrs-fila">
                  <td className="pqrs-id">#{pqrs.id}</td>
                  <td className="pqrs-tipo">{getTipoInfo(pqrs.id_TipoPQRSF)}</td>
                  <td className="pqrs-cliente">
                    {pqrs.nombre_cliente} {pqrs.apellido_cliente}
                  </td>
                  <td className="pqrs-email">{pqrs.email_cliente}</td>
                  <td className="pqrs-asunto">{pqrs.asunto}</td>
                  <td className={`pqrs-estado ${getEstadoClase(pqrs.estado)}`}>
                    {pqrs.estado}
                  </td>
                  <td className="pqrs-fecha">
                    {new Date(pqrs.created_at).toLocaleDateString("es-CO", {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </td>
                  <td className="pqrs-acciones">
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleVerDetalle(pqrs)}
                    >
                      Ver
                    </button>
                    {pqrs.estado === "PENDIENTE" && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleAbrirRespuesta(pqrs)}
                      >
                        Responder
                      </button>
                    )}
                    {pqrs.estado !== "CERRADO" && pqrs.estado !== "RESUELTO" && (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleAbrirRespuesta(pqrs)}
                      >
                        Actualizar
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleEliminar(pqrs.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="pqrs-no-datos">
                  {loading ? "Cargando..." : "No hay PQRS registradas"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {paginaTotal > 1 && (
        <div className="pqrs-paginacion">
          <button
            disabled={filtros.page === 1}
            onClick={() =>
              setFiltros({ ...filtros, page: filtros.page - 1 })
            }
            className="btn btn-secondary btn-sm"
          >
            ← Anterior
          </button>
          <span>
            Página {filtros.page} de {paginaTotal}
          </span>
          <button
            disabled={filtros.page >= paginaTotal}
            onClick={() =>
              setFiltros({ ...filtros, page: filtros.page + 1 })
            }
            className="btn btn-secondary btn-sm"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetalle && selectedPQRS && (
        <div
          className="pqrs-modal-overlay"
          onClick={() => setShowDetalle(false)}
        >
          <div
            className="pqrs-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pqrs-modal-header">
              <h3>Detalle PQRS #{selectedPQRS.id}</h3>
              <button
                className="pqrs-btn-cerrar"
                onClick={() => setShowDetalle(false)}
              >
                ✕
              </button>
            </div>

            <div className="pqrs-modal-body">
              <div className="detalle-grupo">
                <span>Tipo:</span>
                <p>{getTipoInfo(selectedPQRS.id_TipoPQRSF)}</p>
              </div>

              <div className="detalle-grupo">
                <span>Estado:</span>
                <p
                  className={`estado-badge ${getEstadoClase(
                    selectedPQRS.estado
                  )}`}
                >
                  {selectedPQRS.estado}
                </p>
              </div>

              <div className="detalle-grupo">
                <span>Cliente:</span>
                <p>
                  {selectedPQRS.nombre_cliente} {selectedPQRS.apellido_cliente}
                </p>
              </div>

              <div className="detalle-grupo">
                <span>Contacto:</span>
                <p>
                  Email: {selectedPQRS.email_cliente}
                  <br />
                  Teléfono: {selectedPQRS.telefono_cliente}
                </p>
              </div>

              <div className="detalle-grupo">
                <span>Asunto:</span>
                <p>{selectedPQRS.asunto}</p>
              </div>

              <div className="detalle-grupo">
                <span>Descripción:</span>
                <p className="detalle-mensaje">{selectedPQRS.mensaje}</p>
              </div>

              {selectedPQRS.respuesta && (
                <div className="detalle-grupo detalle-respuesta">
                  <span>Respuesta:</span>
                  <p className="detalle-mensaje">{selectedPQRS.respuesta}</p>
                </div>
              )}

              {selectedPQRS.atendido_por && (
                <div className="detalle-grupo">
                  <span>Atendido por:</span>
                  <p>{selectedPQRS.nombre_responsable}</p>
                </div>
              )}

              <div className="detalle-grupo">
                <span>Fechas:</span>
                <p>
                  Creado:{" "}
                  {new Date(selectedPQRS.created_at).toLocaleString("es-CO")}
                  <br />
                  Actualizado:{" "}
                  {new Date(selectedPQRS.updated_at).toLocaleString("es-CO")}
                </p>
              </div>
            </div>

            <div className="pqrs-modal-footer">
              {selectedPQRS.estado !== "CERRADO" && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setShowDetalle(false);
                    handleAbrirRespuesta(selectedPQRS);
                  }}
                >
                  Responder
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowDetalle(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Respuesta */}
      {showRespuestaModal && selectedPQRS && (
        <div
          className="pqrs-modal-overlay"
          onClick={() => setShowRespuestaModal(false)}
        >
          <div
            className="pqrs-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pqrs-modal-header">
              <h3>Responder PQRS #{selectedPQRS.id}</h3>
              <button
                className="pqrs-btn-cerrar"
                onClick={() => setShowRespuestaModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="pqrs-modal-body">
              <div className="detalle-grupo">
                <span>Estado actual:</span>
                <p className={`estado-badge ${getEstadoClase(selectedPQRS.estado)}`}>
                  {selectedPQRS.estado}
                </p>
              </div>

              <div className="detalle-grupo">
                <span>Cliente:</span>
                <p>
                  {selectedPQRS.nombre_cliente} {selectedPQRS.apellido_cliente}
                </p>
              </div>

              <div className="detalle-grupo">
                <span>Asunto:</span>
                <p>{selectedPQRS.asunto}</p>
              </div>

              <div className="detalle-grupo">
                <label htmlFor="pqrs-nuevo-estado">Cambiar a:</label>
                <select
                  id="pqrs-nuevo-estado"
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className="pqrs-form-input"
                  disabled={loadingRespuesta}
                >
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="RESUELTO">Resuelto</option>
                  {selectedPQRS.estado === "RESUELTO" && (
                    <option value="CERRADO">Cerrado</option>
                  )}
                </select>
              </div>

              <div className="detalle-grupo">
                <label htmlFor="pqrs-respuesta">Respuesta:</label>
                <textarea
                  id="pqrs-respuesta"
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  className="pqrs-form-input pqrs-form-textarea"
                  placeholder="Escribe la respuesta..."
                  rows="6"
                  disabled={loadingRespuesta}
                />
              </div>
            </div>

            <div className="pqrs-modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRespuestaModal(false)}
                disabled={loadingRespuesta}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEnviarRespuesta}
                disabled={loadingRespuesta}
              >
                {loadingRespuesta ? "Enviando..." : "Enviar Respuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pqrs;
