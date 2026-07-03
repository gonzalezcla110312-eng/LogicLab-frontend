import { useEffect, useState } from "react"
import api, { construirUrlImagen } from "../../services/api"
import { CATEGORIAS } from "../../services/pedidos"
import imagenPorDefecto from "../../assets/imagen_por_defecto_platillo.png"
import '../../styles/Administrador.css';
import '../../App.css';

// Imagen por defecto para platillos sin imagen
const IMG_POR_DEFECTO = imagenPorDefecto

function Platos() {
    const [platos, setPlatos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [busqueda, setBusqueda] = useState("")
    const [filtroCategoria, setFiltroCategoria] = useState("todas")

    // Estados del modal de edicion
    const [platoEditando, setPlatoEditando] = useState(null)
    const [formEdicion, setFormEdicion] = useState({ Descripcion: "", Precio: "" })
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [modalCrear, setModalCrear] = useState(false)
    const [creando, setCreando] = useState(false)
    const [mensajeCrear, setMensajeCrear] = useState(null)
    const [formNuevo, setFormNuevo] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        categoriaId: "",
        imagenArchivo: null,
    })

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        try {
            const resPlatos = await api.get("/platillos")
            const platillos = (resPlatos.data?.datos || []).map((p) => ({
                id: p.id,
                NombrePlato: p.nombre,
                Descripcion: p.descripcion,
                Precio: Number(p.precio || 0),
                CategoriaId: String(p.categoria_id),
                imagen_url: p.imagen_url || "",
            }))
            setPlatos(platillos)
            setCategorias(CATEGORIAS.map((c) => ({ id: String(c.id), NombreCategoria: c.nombre })))
        } catch (err) {
            setError("No se pudo conectar con el servidor")
        } finally {
            setCargando(false)
        }
    }

    // Abre el modal con los datos actuales del plato
    const abrirEdicion = (plato) => {
        setPlatoEditando(plato)
        setFormEdicion({ Descripcion: plato.Descripcion, Precio: plato.Precio })
        setMensaje(null)
    }

    const cerrarEdicion = () => {
        setPlatoEditando(null)
        setFormEdicion({ Descripcion: "", Precio: "" })
        setMensaje(null)
    }

    const guardarCambios = async () => {
        setGuardando(true)
        try {
            const formData = new FormData()
            formData.append("descripcion", formEdicion.Descripcion)
            formData.append("precio", String(Number(formEdicion.Precio)))

            await api.put(`/platillos/${platoEditando.id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            await cargarDatos()
            setMensaje({ tipo: "ok", texto: "Plato actualizado correctamente" })
            setTimeout(() => cerrarEdicion(), 1200)
        } catch (err) {
            setMensaje({ tipo: "error", texto: "Error al guardar los cambios" })
        } finally {
            setGuardando(false)
        }
    }

    const abrirCrear = () => {
        setFormNuevo({
            nombre: "",
            descripcion: "",
            precio: "",
            categoriaId: "",
            imagenArchivo: null,
        })
        setMensajeCrear(null)
        setModalCrear(true)
    }

    const crearPlatillo = async () => {
        if (!formNuevo.nombre.trim() || !formNuevo.precio || !formNuevo.categoriaId) {
            setMensajeCrear({ tipo: "error", texto: "Nombre, precio y categoría son obligatorios" })
            return
        }

        setCreando(true)
        try {
            const formData = new FormData()
            formData.append("nombre", formNuevo.nombre.trim())
            formData.append("descripcion", formNuevo.descripcion.trim())
            formData.append("precio", String(Number(formNuevo.precio)))
            formData.append("categoria_id", String(formNuevo.categoriaId))

            if (formNuevo.imagenArchivo) {
                formData.append("imagen", formNuevo.imagenArchivo)
            }

            await api.post("/platillos", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })

            setMensajeCrear({ tipo: "ok", texto: "Platillo creado correctamente" })
            await cargarDatos()
            setTimeout(() => setModalCrear(false), 900)
        } catch (err) {
            setMensajeCrear({ tipo: "error", texto: err?.response?.data?.error || "No se pudo crear el platillo" })
        } finally {
            setCreando(false)
        }
    }

    // Filtra por busqueda y categoria al mismo tiempo
    const platosFiltrados = platos.filter(p => {
        const coincideBusqueda = p.NombrePlato.toLowerCase().includes(busqueda.toLowerCase())
        const coincideCategoria = filtroCategoria === "todas" || p.CategoriaId === filtroCategoria
        return coincideBusqueda && coincideCategoria
    })

    const nombreCategoria = (id) =>
        categorias.find(c => c.id === id)?.NombreCategoria ?? "Sin categoría"

    const formatPrecio = (precio) => `$${precio.toLocaleString("es-CO")}`

    if (cargando) return <p className="emp-estado-msg">Cargando platos...</p>
    if (error) return <p className="emp-estado-msg emp-error">{error}</p>

    return (
        <div className="emp-contenedor">

            {/* Header */}
            <div className="emp-header">
                <h1 className="emp-titulo-pagina">Gestión de Platos</h1>
                <p className="emp-subtitulo">{platos.length} platos registrados</p>
                <button className="emp-btn-guardar" onClick={abrirCrear} style={{ marginTop: "0.7rem" }}>
                    + Nuevo Platillo
                </button>
            </div>

            {/* Buscador */}
            <div className="platos-buscador-wrap">
                <input
                    className="platos-buscador"
                    type="text"
                    placeholder="Buscar..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
                <span className="platos-buscador-icon"></span>
            </div>

            {/* Filtro por categoria */}
            <div className="platos-filtros">
                <button
                    className={`platos-filtro-btn ${filtroCategoria === "todas" ? "activo" : ""}`}
                    onClick={() => setFiltroCategoria("todas")}
                >
                    Todos los Platos ↓
                </button>
                {categorias.map(cat => (
                    <button
                        key={cat.id}
                        className={`platos-filtro-btn ${filtroCategoria === cat.id ? "activo" : ""}`}
                        onClick={() => setFiltroCategoria(cat.id)}
                    >
                        {cat.NombreCategoria}
                    </button>
                ))}
            </div>

            {/* Grid de platos */}
            {platosFiltrados.length === 0 ? (
                <p className="emp-estado-msg">No se encontraron platos</p>
            ) : (
                <div className="platos-grid">
                    {platosFiltrados.map(plato => (
                        <div key={plato.id} className="plato-card">
                            <div className="plato-card-img-wrap">
                                <img
                                    src={construirUrlImagen(plato.imagen_url) || IMG_POR_DEFECTO}
                                    alt={plato.NombrePlato}
                                    className="plato-card-img"
                                />
                                <span className="plato-card-categoria">{nombreCategoria(plato.CategoriaId)}</span>
                            </div>
                            <div className="plato-card-body">
                                <p className="plato-card-nombre">{plato.NombrePlato}</p>
                                <p className="plato-card-descripcion">{plato.Descripcion}</p>
                                <p className="plato-card-precio">{formatPrecio(plato.Precio)}</p>
                            </div>
                            <button className="emp-btn-editar" onClick={() => abrirEdicion(plato)}>
                                Editar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de edicion */}
            {platoEditando && (
                <div className="emp-modal-overlay" onClick={cerrarEdicion}>
                    <div className="emp-modal" onClick={e => e.stopPropagation()}>

                        <div className="emp-modal-header">
                            <h2 className="emp-modal-titulo">EDICIÓN</h2>
                            <p className="emp-modal-nombre">{platoEditando.NombrePlato}</p>
                        </div>

                        <div className="emp-modal-body">

                            {/* Imagen (solo visual, la imagen viene de la categoria) */}
                            <div className="plato-modal-img-wrap">
                                <img
                                    src={construirUrlImagen(platoEditando.imagen_url) || IMG_POR_DEFECTO}
                                    alt={platoEditando.NombrePlato}
                                    className="plato-modal-img"
                                />
                                <span className="plato-modal-img-label">
                                    {nombreCategoria(platoEditando.CategoriaId)}
                                </span>
                            </div>

                            {/* Descripcion */}
                            <label className="emp-modal-label">Cambiar Descripción:</label>
                            <textarea
                                className="plato-modal-textarea"
                                value={formEdicion.Descripcion}
                                onChange={e => setFormEdicion({ ...formEdicion, Descripcion: e.target.value })}
                                rows={3}
                            />

                            {/* Precio */}
                            <label className="emp-modal-label">Cambiar Precio:</label>
                            <div className="plato-modal-precio-wrap">
                                <input
                                    className="emp-modal-input"
                                    type="number"
                                    min="0"
                                    value={formEdicion.Precio}
                                    onChange={e => setFormEdicion({ ...formEdicion, Precio: e.target.value })}
                                />
                                <span className="plato-modal-cop">COP</span>
                            </div>

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
                                {guardando ? "Guardando..." : "Editar"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {modalCrear && (
                <div className="emp-modal-overlay" onClick={() => !creando && setModalCrear(false)}>
                    <div className="emp-modal emp-modal-crear emp-modal-scroll" onClick={e => e.stopPropagation()}>
                        <div className="emp-modal-header">
                            <h2 className="emp-modal-titulo">NUEVO PLATILLO</h2>
                            <p className="emp-modal-subtitulo">Crea un producto con imagen opcional</p>
                        </div>

                        <div className="emp-modal-body">
                            <label className="emp-modal-label">Nombre:</label>
                            <input
                                className="emp-modal-input"
                                type="text"
                                value={formNuevo.nombre}
                                onChange={e => setFormNuevo({ ...formNuevo, nombre: e.target.value })}
                            />

                            <label className="emp-modal-label">Descripción:</label>
                            <textarea
                                className="plato-modal-textarea"
                                rows={3}
                                value={formNuevo.descripcion}
                                onChange={e => setFormNuevo({ ...formNuevo, descripcion: e.target.value })}
                            />

                            <label className="emp-modal-label">Precio:</label>
                            <input
                                className="emp-modal-input"
                                type="number"
                                min="0"
                                value={formNuevo.precio}
                                onChange={e => setFormNuevo({ ...formNuevo, precio: e.target.value })}
                            />

                            <label className="emp-modal-label">Categoría:</label>
                            <select
                                className="emp-modal-select"
                                value={formNuevo.categoriaId}
                                onChange={e => setFormNuevo({ ...formNuevo, categoriaId: e.target.value })}
                            >
                                <option value="">Selecciona categoría</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.NombreCategoria}</option>
                                ))}
                            </select>

                            <label className="emp-modal-label">Imagen (archivo):</label>
                            <input
                                className="emp-modal-input"
                                type="file"
                                accept="image/*"
                                onChange={e => setFormNuevo({ ...formNuevo, imagenArchivo: e.target.files?.[0] || null })}
                            />

                            {mensajeCrear && (
                                <p className={`emp-modal-mensaje ${mensajeCrear.tipo === "ok" ? "emp-modal-ok" : "emp-modal-err"}`}>
                                    {mensajeCrear.texto}
                                </p>
                            )}
                        </div>

                        <div className="emp-modal-footer">
                            <button className="emp-btn-cancelar" onClick={() => setModalCrear(false)} disabled={creando}>
                                Cancelar
                            </button>
                            <button className="emp-btn-guardar" onClick={crearPlatillo} disabled={creando}>
                                {creando ? "Creando..." : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Platos;