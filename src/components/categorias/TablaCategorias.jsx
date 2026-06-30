import React from "react";
import { Table, Spinner } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaCategorias = ({
  categorias = [],
  cargando = false,
  abrirModalEdicion,
  abrirModalEliminacion,
}) => {
  if (cargando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "#2889b6" }} role="status" />
        <p className="mt-2 mb-0 text-muted">Cargando categorías...</p>
      </div>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-folder-x" style={{ fontSize: "2rem" }}></i>
        <h5 className="mt-2">No hay categorías para mostrar.</h5>
      </div>
    );
  }

  return (
    <Table responsive size="sm" className="tabla-moderna mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th className="d-none d-md-table-cell">Descripción</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {categorias.map((categoria) => (
          <tr key={categoria.id_categoria}>
            <td>
              <span className="badge-id-moderno">{categoria.id_categoria}</span>
            </td>
            <td className="fw-semibold" style={{ color: "#1e2a5e" }}>
              {categoria.nombre_categoria}
            </td>
            <td className="d-none d-md-table-cell text-muted">
              {categoria.descripcion_categoria || categoria.descripcion || (
                <span className="fst-italic">Sin descripción</span>
              )}
            </td>
            <td className="text-center text-nowrap">
              <button
                className="btn-accion-moderno btn-accion-editar"
                title="Editar categoría"
                onClick={() => abrirModalEdicion(categoria)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn-accion-moderno btn-accion-eliminar"
                title="Eliminar categoría"
                onClick={() => abrirModalEliminacion(categoria)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default TablaCategorias;