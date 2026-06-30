import React from "react";
import { Table, Image, Alert } from "react-bootstrap";

const TablaProductos = ({
  productos,
  categorias = [],
  onEditar,
  onEliminar,
  onPDF,
}) => {
  const obtenerNombreCategoria = (idCategoria) => {
    const cat = categorias.find((c) => c.id_categoria === idCategoria);
    return cat ? cat.nombre_categoria : "Sin categoría";
  };

  if (!productos || productos.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-box-seam" style={{ fontSize: "2rem" }}></i>
        <h5 className="mt-2">No hay productos registrados.</h5>
      </div>
    );
  }

  return (
    <Table responsive className="tabla-moderna mb-0">
      <thead>
        <tr>
          <th>#</th>
          <th>Imagen</th>
          <th>Nombre</th>
          <th className="d-none d-lg-table-cell">Descripción</th>
          <th>Categoría</th>
          <th className="text-end">Precio</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>

      <tbody>
        {productos.map((prod, index) => (
          <tr key={prod.id_producto}>
            <td>
              <span className="badge-id-moderno">{index + 1}</span>
            </td>

            <td>
              {prod.url_imagen ? (
                <Image
                  src={prod.url_imagen}
                  alt={prod.nombre_producto}
                  width={48}
                  height={48}
                  style={{ objectFit: "cover", borderRadius: "10px" }}
                />
              ) : (
                <div
                  className="d-flex align-items-center justify-content-center text-muted"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "10px",
                    background: "#f4f6fb",
                  }}
                >
                  <i className="bi bi-image"></i>
                </div>
              )}
            </td>

            <td className="fw-semibold" style={{ color: "#1e2a5e" }}>
              {prod.nombre_producto}
            </td>

            <td className="d-none d-lg-table-cell text-muted">
              {prod.descripcion_producto || (
                <span className="fst-italic">Sin descripción</span>
              )}
            </td>

            <td>
              <span
                className="badge rounded-pill"
                style={{
                  background: "rgba(40, 137, 182, 0.12)",
                  color: "#1e3d87",
                  fontWeight: 600,
                  padding: "6px 12px",
                }}
              >
                {obtenerNombreCategoria(prod.categoria_producto)}
              </span>
            </td>

            <td className="text-end fw-semibold">
              C$ {parseFloat(prod.precio_venta).toFixed(2)}
            </td>

            <td className="text-center text-nowrap">
              <button
                className="btn-accion-moderno btn-accion-editar"
                title="Editar producto"
                onClick={() => onEditar(prod)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn-accion-moderno btn-accion-eliminar"
                title="Eliminar producto"
                onClick={() => onEliminar(prod)}
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

export default TablaProductos;