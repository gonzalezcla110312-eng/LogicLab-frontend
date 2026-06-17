import { useEffect, useState } from "react"
import api, { normalizarRol } from "../../services/api"
import '../../styles/Administrador.css';
import '../../App.css';

function Empleados({ usuario }) {
    const [empleados, setEmpleados] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [empleadoEditando, setEmpleadoEditando] = useState(null)  // empleado seleccionado para editar
    const [formEdicion, setFormEdicion] = useState({ nombre: "", apellido: "", email: "", rol: "", nuevaPassword: "" })
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)  // feedback de exito/error

    // ── Estado para activar/inactivar usuario ──
    const [empleadoEstadoPendiente, setEmpleadoEstadoPendiente] = useState(null)
    const [actualizandoEstadoUsuario, setActualizandoEstadoUsuario] = useState(false)

    // ── Estado para crear usuario en formulario unico ──
    const [formNuevo, setFormNuevo] = useState({
        nombre: "",
        apellido: "",
        email: "",
        password: "",
        rol: "mesero",
    })
    const [guardandoNuevo, setGuardandoNuevo] = useState(false)
    const [mensajeNuevo, setMensajeNuevo] = useState(null)
    const [modalCrearAbierta, setModalCrearAbierta] = useState(false)

    const usuarioActivo = usuario || JSON.parse(localStorage.getItem("usuario") || "null")
    const esAdministrador = usuarioActivo?.rol === "Administrador"
    const rolesPermitidos = new Set(["administrador", "mesero", "cocinero"])
    const rolBackend = { Mesero: "mesero", Cocinero: "cocinero", Administrador: "administrador" }

    const esUsuarioActivo = (empleado) => {
        if (typeof empleado?.activo === "boolean") return empleado.activo
        if (typeof empleado?.activo === "number") return empleado.activo === 1
        if (typeof empleado?.activa === "boolean") return empleado.activa
        if (typeof empleado?.activa === "number") return empleado.activa === 1
        if (typeof empleado?.estado === "string") return empleado.estado.toUpperCase() !== "INACTIVO"
        return true
    }

    const abrirConfirmacionEstado = (emp) => setEmpleadoEstadoPendiente(emp)
    const cerrarConfirmacionEstado = () => {
        if (!actualizandoEstadoUsuario) setEmpleadoEstadoPendiente(null)
    }

    const cambiarEstadoEmpleado = async () => {
        if (!esAdministrador) return
        if (!empleadoEstadoPendiente?.id) return

        const endpoint = esUsuarioActivo(empleadoEstadoPendiente)
            ? `/usuarios/${empleadoEstadoPendiente.id}/inactivar`
            : `/usuarios/${empleadoEstadoPendiente.id}/activar`

        setActualizandoEstadoUsuario(true)
        try {
            await api.patch(endpoint)
            await obtenerEmpleados()
            setEmpleadoEstadoPendiente(null)
        } catch (error_) {
            setEmpleadoEstadoPendiente(null)
        } finally {
            setActualizandoEstadoUsuario(false)
        }
    }

    const crearUsuario = async () => {
        if (!esAdministrador) {
            setMensajeNuevo({ tipo: "error", texto: "Solo un administrador puede registrar usuarios" })
            return
        }

        const { nombre, apellido, email, password, rol } = formNuevo
        if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
            setMensajeNuevo({ tipo: "error", texto: "Todos los campos son obligatorios" })
            return
        }
        if (password.trim().length < 6) {
            setMensajeNuevo({ tipo: "error", texto: "La contraseña debe tener al menos 6 caracteres" })
            return
        }
        if (!rolesPermitidos.has(rol)) {
            setMensajeNuevo({ tipo: "error", texto: "El rol seleccionado no es valido" })
            return
        }

        setGuardandoNuevo(true)
        try {
            const nuevoUsuario = {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email.trim(),
                password: password.trim(),
                rol,
            }

            await api.post("/usuarios", nuevoUsuario)
            await obtenerEmpleados()
            setMensajeNuevo({ tipo: "ok", texto: "Usuario creado correctamente" })
            setFormNuevo({
                nombre: "",
                apellido: "",
                email: "",
                password: "",
                rol: "mesero",
            })
            setTimeout(() => {
                setModalCrearAbierta(false)
                setMensajeNuevo(null)
            }, 900)
        } catch (err) {
            setMensajeNuevo({
                tipo: "error",
                texto: err?.response?.data?.error || "Error al crear el usuario",
            })
        } finally {
            setGuardandoNuevo(false)
        }
    }

    const abrirModalCrear = () => {
        setMensajeNuevo(null)
        setModalCrearAbierta(true)
    }

    const cerrarModalCrear = () => {
        if (guardandoNuevo) return
        setModalCrearAbierta(false)
        setMensajeNuevo(null)
    }

    useEffect(() => {
        obtenerEmpleados()
    }, [])

    const obtenerEmpleados = async () => {
        try {
            const res = await api.get("/usuarios")
            const usuarios = (res.data?.datos || []).map((u) => ({
                ...u,
                rol: normalizarRol(u.rol),
                activo: esUsuarioActivo(u),
            }))
            setEmpleados(usuarios)
        } catch (error_) {
            setError("No se pudo conectar con el servidor")
        } finally {
            setCargando(false)
        }
    }

    // Abre el modal con los datos actuales del empleado
    const abrirEdicion = (emp) => {
        setEmpleadoEditando(emp)
        setFormEdicion({
            nombre: emp.nombre || "",
            apellido: emp.apellido || "",
            email: emp.email || "",
            rol: emp.rol || "",
            nuevaPassword: "",
        })
        setMensaje(null)
    }

    const cerrarEdicion = () => {
        setEmpleadoEditando(null)
        setFormEdicion({ nombre: "", apellido: "", email: "", rol: "", nuevaPassword: "" })
        setMensaje(null)
    }

    const guardarCambios = async () => {
        if (!esAdministrador) return
        setGuardando(true)
        try {
            // Arma el objeto con los campos a actualizar
            const cambios = {
                nombre: formEdicion.nombre.trim(),
                apellido: formEdicion.apellido.trim(),
                email: formEdicion.email,
                rol: rolBackend[formEdicion.rol],
                tipo_documento_id: empleadoEditando.tipo_documento_id || 1,
            }

            if (formEdicion.nuevaPassword.trim() !== "") {
                cambios.password = formEdicion.nuevaPassword
            }

            await api.put(`/usuarios/${empleadoEditando.id}`, cambios)

            // Refresca la lista y cierra el modal
            await obtenerEmpleados()
            setMensaje({ tipo: "ok", texto: "Empleado actualizado correctamente" })
            setTimeout(() => cerrarEdicion(), 1200)
        } catch (error_) {
            setMensaje({ tipo: "error", texto: "Error al guardar los cambios" })
        } finally {
            setGuardando(false)
        }
    }

    const meseros = empleados.filter(e => e.rol === "Mesero")
    const cocineros = empleados.filter(e => e.rol === "Cocinero")
    const administradores = empleados.filter(e => e.rol === "Administrador")

    const GrupoEmpleados = ({ titulo, lista, className }) => (
        <div className={`emp-grupo ${className}`}>
            <h2 className="emp-grupo-titulo">
                {titulo}
                <span className="emp-grupo-count">{lista.length}</span>
            </h2>

            {lista.length === 0 ? (
                <p className="emp-sin-resultados">Sin empleados en este rol</p>
            ) : (
                <div className="emp-cards-grid">
                    {lista.map(emp => (
                        <div key={emp.id} className={`emp-card ${emp.activo ? "" : "emp-card-inactivo"}`}>
                            <div className="emp-card-avatar">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="8" r="4" className="emp-avatar-fill" />
                                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" className="emp-avatar-stroke" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </div>
                            <div className="emp-card-info">
                                <p className="emp-card-nombre">{emp.nombre} {emp.apellido}</p>
                                <p className="emp-card-email">{emp.email}</p>
                                <span className="emp-card-badge">{emp.rol}</span>
                                <span className={`emp-card-estado ${emp.activo ? "emp-card-estado-activo" : "emp-card-estado-inactivo"}`}>
                                    {emp.activo ? "Activo" : "Desactivado"}
                                </span>
                            </div>
                            <div className="emp-card-acciones">
                                <button className="emp-btn-editar" onClick={() => abrirEdicion(emp)} disabled={!esAdministrador}>
                                    Editar
                                </button>
                                <button
                                    className={`emp-btn-eliminar ${emp.activo ? "" : "emp-btn-reactivar"}`}
                                    onClick={() => abrirConfirmacionEstado(emp)}
                                    disabled={!esAdministrador}
                                >
                                    {emp.activo ? "Desactivar" : "Activar"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    if (cargando) return <p className="emp-estado-msg">Cargando empleados...</p>
    if (error)    return <p className="emp-estado-msg emp-error">{error}</p>

    return (
        <div className="emp-contenedor">
            <div className="emp-header">
                <h1 className="emp-titulo-pagina">Gestión de Empleados</h1>
                <p className="emp-subtitulo">{empleados.length} empleados registrados</p>
                {!esAdministrador && (
                    <p className="emp-estado-msg emp-error" style={{ marginTop: "0.5rem" }}>
                        Solo un administrador puede crear, editar o inactivar usuarios.
                    </p>
                )}
                <div style={{ marginTop: "0.9rem" }}>
                    <button
                        className="emp-btn-guardar"
                        onClick={abrirModalCrear}
                        disabled={!esAdministrador}
                        style={{ padding: "0.55rem 0.9rem", fontSize: "0.88rem", width: "auto", minWidth: "140px" }}
                    >
                        Crear Usuario
                    </button>
                </div>
            </div>

            <GrupoEmpleados titulo="MESEROS" lista={meseros} className="grupo-mesero" />
            <GrupoEmpleados titulo="COCINEROS" lista={cocineros} className="grupo-cocinero" />
            <GrupoEmpleados titulo="ADMINISTRADORES" lista={administradores} className="grupo-admin" />

            {modalCrearAbierta && (
                <div className="emp-modal-overlay" onClick={cerrarModalCrear}>
                    <div className="emp-modal" onClick={e => e.stopPropagation()}>
                        <div className="emp-modal-header">
                            <h2 className="emp-modal-titulo">CREAR USUARIO</h2>
                            <p className="emp-modal-subtitulo">Completa los datos del nuevo usuario</p>
                        </div>

                        <div className="emp-modal-body" style={{ display: "grid", gap: "0.75rem" }}>
                            <label className="emp-modal-label" htmlFor="nuevo-nombre">Nombre:</label>
                            <input
                                id="nuevo-nombre"
                                className="emp-modal-input"
                                type="text"
                                value={formNuevo.nombre}
                                onChange={e => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
                                disabled={!esAdministrador || guardandoNuevo}
                            />

                            <label className="emp-modal-label" htmlFor="nuevo-apellido">Apellido:</label>
                            <input
                                id="nuevo-apellido"
                                className="emp-modal-input"
                                type="text"
                                value={formNuevo.apellido}
                                onChange={e => setFormNuevo({ ...formNuevo, apellido: e.target.value })}
                                disabled={!esAdministrador || guardandoNuevo}
                            />

                            <label className="emp-modal-label" htmlFor="nuevo-email">Email:</label>
                            <input
                                id="nuevo-email"
                                className="emp-modal-input"
                                type="email"
                                value={formNuevo.email}
                                onChange={e => setFormNuevo({ ...formNuevo, email: e.target.value })}
                                disabled={!esAdministrador || guardandoNuevo}
                            />

                            <label className="emp-modal-label" htmlFor="nuevo-password">Contraseña:</label>
                            <input
                                id="nuevo-password"
                                className="emp-modal-input"
                                type="password"
                                value={formNuevo.password}
                                onChange={e => setFormNuevo({ ...formNuevo, password: e.target.value })}
                                disabled={!esAdministrador || guardandoNuevo}
                            />

                            <label className="emp-modal-label" htmlFor="nuevo-rol">Rol:</label>
                            <select
                                id="nuevo-rol"
                                className="emp-modal-select"
                                value={formNuevo.rol}
                                onChange={e => setFormNuevo({ ...formNuevo, rol: e.target.value })}
                                disabled={!esAdministrador || guardandoNuevo}
                            >
                                <option value="administrador">administrador</option>
                                <option value="mesero">mesero</option>
                                <option value="cocinero">cocinero</option>
                            </select>

                            {mensajeNuevo && (
                                <p className={`emp-modal-mensaje ${mensajeNuevo.tipo === "ok" ? "emp-modal-ok" : "emp-modal-err"}`}>
                                    {mensajeNuevo.texto}
                                </p>
                            )}
                        </div>

                        <div className="emp-modal-footer">
                            <button className="emp-btn-cancelar" onClick={cerrarModalCrear} disabled={guardandoNuevo}>
                                Cancelar
                            </button>
                            <button className="emp-btn-guardar" onClick={crearUsuario} disabled={!esAdministrador || guardandoNuevo}>
                                {guardandoNuevo ? "Guardando..." : "Guardar Usuario"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de edición ── */}
            {empleadoEditando && (
                <div className="emp-modal-overlay" onClick={cerrarEdicion}>
                    <div className="emp-modal" onClick={e => e.stopPropagation()}>

                        <div className="emp-modal-header">
                            <h2 className="emp-modal-titulo">EDICIÓN</h2>
                            <p className="emp-modal-nombre">{empleadoEditando.nombre} {empleadoEditando.apellido}</p>
                        </div>

                        <div className="emp-modal-body">
                            <label className="emp-modal-label" htmlFor="editar-nombre">Nombre:</label>
                            <input
                                id="editar-nombre"
                                className="emp-modal-input"
                                type="text"
                                value={formEdicion.nombre}
                                onChange={e => setFormEdicion({ ...formEdicion, nombre: e.target.value })}
                            />

                            <label className="emp-modal-label" htmlFor="editar-apellido">Apellido:</label>
                            <input
                                id="editar-apellido"
                                className="emp-modal-input"
                                type="text"
                                value={formEdicion.apellido}
                                onChange={e => setFormEdicion({ ...formEdicion, apellido: e.target.value })}
                            />

                            <label className="emp-modal-label" htmlFor="editar-email">Email:</label>
                            <input
                                id="editar-email"
                                className="emp-modal-input"
                                type="email"
                                value={formEdicion.email}
                                onChange={e => setFormEdicion({ ...formEdicion, email: e.target.value })}
                            />

                            <label className="emp-modal-label" htmlFor="editar-rol">Rol:</label>
                            <select
                                id="editar-rol"
                                className="emp-modal-select"
                                value={formEdicion.rol}
                                onChange={e => setFormEdicion({ ...formEdicion, rol: e.target.value })}
                            >
                                <option value="Mesero">Mesero</option>
                                <option value="Cocinero">Cocinero</option>
                                <option value="Administrador">Administrador</option>
                            </select>

                            <label className="emp-modal-label" htmlFor="editar-password">Cambio de contraseña: <span className="emp-modal-opcional">(opcional)</span></label>
                            <input
                                id="editar-password"
                                className="emp-modal-input"
                                type="password"
                                placeholder="Nueva contraseña..."
                                value={formEdicion.nuevaPassword}
                                onChange={e => setFormEdicion({ ...formEdicion, nuevaPassword: e.target.value })}
                            />

                            {mensaje && (
                                <p className={`emp-modal-mensaje ${mensaje.tipo === "ok" ? "emp-modal-ok" : "emp-modal-err"}`}>
                                    {mensaje.texto}
                                </p>
                            )}
                        </div>

                        <div className="emp-modal-footer">
                            <button className="emp-btn-cancelar" onClick={cerrarEdicion} disabled={guardando}>
                                Cancelar
                            </button>
                            <button className="emp-btn-guardar" onClick={guardarCambios} disabled={guardando}>
                                {guardando ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>

                    </div>
                </div>
            )}
            {/* ── Modal confirmacion activar/inactivar ── */}
            {empleadoEstadoPendiente && (
                <div className="emp-modal-overlay" onClick={cerrarConfirmacionEstado}>
                    <div className="emp-modal emp-modal-confirmar" onClick={e => e.stopPropagation()}>

                        <div className="emp-modal-header emp-modal-header-eliminar">
                            <h2 className="emp-modal-titulo">
                                {esUsuarioActivo(empleadoEstadoPendiente) ? "DESACTIVAR USUARIO" : "ACTIVAR USUARIO"}
                            </h2>
                            <p className="emp-modal-nombre">{empleadoEstadoPendiente.nombre} {empleadoEstadoPendiente.apellido}</p>
                        </div>

                        <div className="emp-modal-body">
                            <p className="emp-confirmar-texto">
                                {esUsuarioActivo(empleadoEstadoPendiente)
                                    ? <>¿Deseas desactivar a <strong>{empleadoEstadoPendiente.nombre} {empleadoEstadoPendiente.apellido}</strong>? El usuario no podrá operar hasta ser reactivado.</>
                                    : <>¿Deseas reactivar a <strong>{empleadoEstadoPendiente.nombre} {empleadoEstadoPendiente.apellido}</strong>? El usuario volverá a estar disponible en el sistema.</>
                                }
                            </p>
                        </div>

                        <div className="emp-modal-footer">
                            <button className="emp-btn-cancelar" onClick={cerrarConfirmacionEstado} disabled={actualizandoEstadoUsuario}>
                                Cancelar
                            </button>
                            <button
                                className={`emp-btn-eliminar-modal ${esUsuarioActivo(empleadoEstadoPendiente) ? "" : "emp-btn-reactivar-modal"}`}
                                onClick={cambiarEstadoEmpleado}
                                disabled={actualizandoEstadoUsuario}
                            >
                                {actualizandoEstadoUsuario
                                    ? "Procesando..."
                                    : esUsuarioActivo(empleadoEstadoPendiente)
                                        ? "Sí, desactivar"
                                        : "Sí, activar"
                                }
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}

export default Empleados;