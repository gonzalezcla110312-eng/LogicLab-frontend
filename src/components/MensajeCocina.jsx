import { useEffect, useState } from "react";
import '../styles/MensajeCocina.css';
import '../App.css';
import { obtenerTodosLosPedidos, cambiarEstadoPedido } from "../services/pedidos";

function MensajeCocina({ usuario, setPagina }) {
  const [pedidosListos, setPedidosListos] = useState([]);
  const [pedidoProcesando, setPedidoProcesando] = useState(null);

  if (!usuario) {
    const usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    if (usuarioGuardado) { usuario = usuarioGuardado; }
  }

  useEffect(() => {
    cargarNotificacionesCocina();
  }, []);

  const cargarNotificacionesCocina = async () => {
    try {
      const pedidos = await obtenerTodosLosPedidos();
      setPedidosListos(pedidos.filter((p) => p.estadoPedido === "PARA_ENTREGA"));
    } catch (error) {
      console.error("Error cargando pedidos listos:", error);
    }
  };

  const entregarPedido = async (pedidoId) => {
    if (!pedidoId) return;
    setPedidoProcesando(pedidoId);
    try {
      await cambiarEstadoPedido(pedidoId, "ENTREGADO");
      await cargarNotificacionesCocina();
      alert("Pedido marcado como ENTREGADO.");
    } catch (error) {
      alert(error?.response?.data?.error || "No se pudo marcar el pedido como ENTREGADO.");
    } finally {
      setPedidoProcesando(null);
    }
  };

  return (
    <div className="mco-container">

      <header className="mco-header">
        <div className="mco-header-center">
          <h1 className="mco-titulo">Avisos de Cocina</h1>
          <p className="mco-mesero">Mesero: {usuario?.nombre}</p>
          <div className="mco-titulo-linea"></div>
        </div>
      </header>

      <div className="mco-lista">
        {pedidosListos.length === 0 ? (
          <div className="mco-vacio">
            <p>No hay pedidos listos por entregar.</p>
          </div>
        ) : (
          pedidosListos.map(pedido => (
            <div key={pedido.id} className="mco-card">

              <div className="mco-card-header">
                <span className="mco-badge-mesa">MESA {pedido.mesa}</span>
                <span className="mco-badge-listo">PARA_ENTREGA</span>
                <span className="mco-total">${pedido.totalPagar?.toLocaleString("es-CO")}</span>
              </div>

              <div className="mco-card-body">

                {pedido.platos.length > 0 && (
                  <div className="mco-grupo">
                    <p className="mco-grupo-label">Platos</p>
                    {pedido.platos.map((d, i) => (
                      <div key={i} className="mco-detalle-item">
                        <div className="mco-detalle-info">
                          <span className="mco-detalle-nombre">{d.cantidadPedido}x {d.NombrePlato}</span>
                          {d.notasEspeciales && (
                            <span className="mco-detalle-nota">{d.notasEspeciales}</span>
                          )}
                        </div>
                        <span className="mco-detalle-precio">${d.precioFinal?.toLocaleString("es-CO")}</span>
                      </div>
                    ))}
                  </div>
                )}

                {pedido.bebidas.length > 0 && (
                  <div className="mco-grupo">
                    <p className="mco-grupo-label">Bebidas</p>
                    {pedido.bebidas.map((d, i) => (
                      <div key={i} className="mco-detalle-item">
                        <div className="mco-detalle-info">
                          <span className="mco-detalle-nombre">{d.cantidadPedido}x {d.NombrePlato}</span>
                          {d.notasEspeciales && (
                            <span className="mco-detalle-nota">{d.notasEspeciales}</span>
                          )}
                        </div>
                        <span className="mco-detalle-precio">${d.precioFinal?.toLocaleString("es-CO")}</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="mco-card-footer">
                <button
                  className="mco-btn-entregar"
                  onClick={() => entregarPedido(pedido.id)}
                  disabled={pedidoProcesando === pedido.id}
                >
                  {pedidoProcesando === pedido.id ? "Procesando..." : "Confirmar ENTREGADO"}
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      <button className="mco-btn-volver" onClick={() => setPagina("mesero")}>
        ← Volver al Panel
      </button>

    </div>
  );
}

export default MensajeCocina;