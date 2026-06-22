/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { obtenerTiposPQRS, registrarPQRS } from "../services/pqrs";
import "../styles/RegistroPQRS.css";
import { FaArrowLeft, FaUser, FaPhone, FaEnvelope, FaFileAlt, FaCheckCircle, FaPaperPlane, FaSpinner } from "react-icons/fa";

function RegistroPQRS({ setPagina }) {
  const [tiposPQRS, setTiposPQRS] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    id_TipoPQRSF: "",
    nombre_cliente: "",
    apellido_cliente: "",
    email_cliente: "",
    telefono_cliente: "",
    asunto: "",
    mensaje: "",
  });

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    try {
      const tipos = await obtenerTiposPQRS();
      setTiposPQRS(tipos);
    } catch (err) {
      setError("No se pudieron cargar los tipos de PQRS");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validaciones
      if (
        !formData.id_TipoPQRSF ||
        !formData.nombre_cliente ||
        !formData.apellido_cliente ||
        !formData.email_cliente ||
        !formData.telefono_cliente ||
        !formData.asunto ||
        !formData.mensaje
      ) {
        setError("Por favor completa todos los campos");
        setLoading(false);
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email_cliente)) {
        setError("Por favor ingresa un correo electrónico válido");
        setLoading(false);
        return;
      }

      // Registrar PQRS
      await registrarPQRS({
        ...formData,
        id_TipoPQRSF: Number.parseInt(formData.id_TipoPQRSF, 10),
      });

      setSuccess(true);
      setFormData({
        id_TipoPQRSF: "",
        nombre_cliente: "",
        apellido_cliente: "",
        email_cliente: "",
        telefono_cliente: "",
        asunto: "",
        mensaje: "",
      });

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        setPagina("login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Error al registrar la PQRS"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-pqrs-container">
      <button
        className="pqrs-btn-volver-flotante"
        onClick={() => setPagina("login")}
        disabled={loading}
        title="Volver"
      >
        <FaArrowLeft />
      </button>

      <div className="registro-pqrs-card">
        <div className="pqrs-header">
          <p className="registro-pqrs-kicker">Canal de atención</p>
          <h1 className="registro-pqrs-title">Registrar PQRS</h1>
          <p className="registro-pqrs-subtitle">
            Peticiones, Quejas, Reclamos, Sugerencias y Felicitaciones
          </p>
        </div>

        {success && (
          <div className="alert alert-success pqrs-success-alert">
            <FaCheckCircle className="alert-icon" />
            <div className="alert-content">
              <strong>¡Éxito!</strong>
              <p>Tu PQRS ha sido registrada exitosamente. Serás redirigido al login...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error pqrs-error-alert">
            <div className="alert-icon">!</div>
            <div className="alert-content">
              <strong>Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="registro-pqrs-form">
          {/* Tipo de PQRS */}
          <div className="form-group pqrs-form-group-tipo">
            <label htmlFor="id_TipoPQRSF">Tipo de PQRS *</label>
            <div className="pqrs-select-wrapper">
              <select
                id="id_TipoPQRSF"
                name="id_TipoPQRSF"
                value={formData.id_TipoPQRSF}
                onChange={handleChange}
                className="form-input pqrs-select"
                disabled={loading}
                required
              >
                <option value="">Selecciona un tipo</option>
                {tiposPQRS.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} - {tipo.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Datos personales */}
          <div className="pqrs-section-title">Información Personal</div>
          <div className="form-row">
            <div className="form-group pqrs-input-icon">
              <label htmlFor="nombre_cliente">Nombre *</label>
              <div className="pqrs-input-wrapper">
                <FaUser className="pqrs-field-icon" />
                <input
                  type="text"
                  id="nombre_cliente"
                  name="nombre_cliente"
                  value={formData.nombre_cliente}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Tu nombre"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group pqrs-input-icon">
              <label htmlFor="apellido_cliente">Apellido *</label>
              <div className="pqrs-input-wrapper">
                <FaUser className="pqrs-field-icon" />
                <input
                  type="text"
                  id="apellido_cliente"
                  name="apellido_cliente"
                  value={formData.apellido_cliente}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Tu apellido"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="pqrs-section-title">Datos de Contacto</div>
          <div className="form-row">
            <div className="form-group pqrs-input-icon">
              <label htmlFor="email_cliente">Correo Electrónico *</label>
              <div className="pqrs-input-wrapper">
                <FaEnvelope className="pqrs-field-icon" />
                <input
                  type="email"
                  id="email_cliente"
                  name="email_cliente"
                  value={formData.email_cliente}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="tu@email.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group pqrs-input-icon">
              <label htmlFor="telefono_cliente">Teléfono *</label>
              <div className="pqrs-input-wrapper">
                <FaPhone className="pqrs-field-icon" />
                <input
                  type="tel"
                  id="telefono_cliente"
                  name="telefono_cliente"
                  value={formData.telefono_cliente}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="3101234567"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Asunto */}
          <div className="pqrs-section-title">Detalles de la Solicitud</div>
          <div className="form-group pqrs-input-icon">
            <label htmlFor="asunto">Asunto *</label>
            <div className="pqrs-input-wrapper">
              <FaFileAlt className="pqrs-field-icon" />
              <input
                type="text"
                id="asunto"
                name="asunto"
                value={formData.asunto}
                onChange={handleChange}
                className="form-input"
                placeholder="Resumen de tu solicitud"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Mensaje */}
          <div className="form-group pqrs-textarea-group">
            <div className="pqrs-label-wrapper">
              <label htmlFor="mensaje">Descripción *</label>
              <span className="pqrs-char-count">{formData.mensaje.length}/500</span>
            </div>
            <textarea
              id="mensaje"
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              className="form-input form-textarea"
              placeholder="Proporciona los detalles de tu petición, queja, reclamo, sugerencia o felicitación..."
              disabled={loading}
              rows="5"
              maxLength="500"
              required
            />
          </div>

          {/* Botones */}
          <div className="form-actions pqrs-form-actions">
            <button
              type="button"
              className="btn btn-secondary pqrs-btn-cancelar"
              onClick={() => setPagina("login")}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary pqrs-btn-enviar"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spin" /> Enviando...
                </>
              ) : (
                <>
                  <FaPaperPlane /> Enviar PQRS
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistroPQRS;
