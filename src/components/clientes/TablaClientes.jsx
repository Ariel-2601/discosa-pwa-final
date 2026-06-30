import React from "react";
import { Table, Spinner } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const coloresAvatar = ["#121b96", "#2889b6", "#2697cc", "#6f42c1", "#198754", "#c98a00"];

const colorPorNombre = (texto) => {
  const base = texto || "?";
  const indice = base.charCodeAt(0) % coloresAvatar.length;
  return coloresAvatar[Math.abs(indice) || 0];
};

const estiloAvatar = (color) => ({ width: 36, height: 36, borderRadius: "50%", background: color, flexShrink: 0, fontSize: "0.85rem" });
const estiloNombre = { color: "#1e2a5e" };
const estiloWhatsapp = { color: "#198754" };

const TablaClientes = (props) => {
  const clientes = props.clientes || [];
  const cargando = props.cargando || false;
  const abrirModalEdicion = props.abrirModalEdicion;
  const abrirModalEliminacion = props.abrirModalEliminacion;

  if (cargando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2 mb-0 text-muted">Cargando clientes...</p>
      </div>
    );
  }

  if (clientes.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-people"></i>
        <h5 className="mt-2">No hay clientes para mostrar.</h5>
      </div>
    );
  }

  return (
    <Table responsive size="sm" className="tabla-moderna mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Cliente</th>
          <th className="d-none d-md-table-cell">Celular</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {clientes.map(function (cliente) {
          const nombreCompleto = cliente.nombre_cliente + " " + (cliente.apellido_cliente || "");
          const inicial = (cliente.nombre_cliente || "?").charAt(0).toUpperCase();
          const color = colorPorNombre(cliente.nombre_cliente);
          const soloNumeros = (cliente.celular || "").replace(/[^0-9]/g, "");
          const linkWhatsapp = "https://wa.me/505" + soloNumeros;

          const filaEditar = function () { abrirModalEdicion(cliente); };
          const filaEliminar = function () { abrirModalEliminacion(cliente); };

          return (
            <tr key={cliente.id_cliente}>
              <td><span className="badge-id-moderno">{cliente.id_cliente}</span></td>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center justify-content-center fw-bold text-white" style={estiloAvatar(color)}>{inicial}</div>
                  <div>
                    <div className="fw-semibold" style={estiloNombre}>{nombreCompleto}</div>
                    <div className="text-muted small d-md-none">{cliente.celular || "Sin celular"}</div>
                  </div>
                </div>
              </td>
              <td className="d-none d-md-table-cell">
                {soloNumeros ? <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" className="text-decoration-none" style={estiloWhatsapp}><i className="bi bi-whatsapp me-1"></i>{cliente.celular}</a> : <span className="text-muted fst-italic">Sin registrar</span>}
              </td>
              <td className="text-center text-nowrap">
                <button className="btn-accion-moderno btn-accion-editar" title="Editar cliente" onClick={filaEditar}><i className="bi bi-pencil"></i></button>
                <button className="btn-accion-moderno btn-accion-eliminar" title="Eliminar cliente" onClick={filaEliminar}><i className="bi bi-trash"></i></button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default TablaClientes;