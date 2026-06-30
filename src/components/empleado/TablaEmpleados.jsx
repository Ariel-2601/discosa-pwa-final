import React, { useState } from "react";
import { Table, Spinner } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaEmpleados = ({
  empleados = [],
  cargando = false,
  abrirModalEdicion,
}) => {
  const [pinVisible, setPinVisible] = useState(null);

  if (cargando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "#2889b6" }} role="status" />
        <p className="mt-2 mb-0 text-muted">Cargando empleados...</p>
      </div>
    );
  }

  if (!empleados || empleados.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-person-x" style={{ fontSize: "2rem" }}></i>
        <h5 className="mt-2">No hay empleados para mostrar.</h5>
      </div>
    );
  }

  const coloresRol = {
    administrador: { bg: "rgba(220, 53, 69, 0.12)", color: "#dc3545" },
    vendedor: { bg: "rgba(40, 137, 182, 0.12)", color: "#1e3d87" },
    cajero: { bg: "rgba(25, 135, 84, 0.12)", color: "#198754" },
  };

  const estiloRol = (rol) =>
    coloresRol[(rol || "").toLowerCase()] || {
      bg: "rgba(108, 117, 125, 0.12)",
      color: "#6c757d",
    };

  return (
    <Table responsive size="sm" className="tabla-moderna mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th className="d-none d-md-table-cell">Email</th>
          <th className="d-none d-md-table-cell">Celular</th>
          <th className="d-none d-lg-table-cell">PIN</th>
          <th>Rol</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {empleados.map((empleado) => {
          const rolEstilo = estiloRol(empleado.tipo_empleado);
          const pinOculto = pinVisible !== empleado.id_empleado;

          return (
            <tr key={empleado.id_empleado}>
              <td>
                <span className="badge-id-moderno">{empleado.id_empleado}</span>
              </td>

              <td>
                <div className="fw-semibold" style={{ color: "#1e2a5e" }}>
                  {empleado.nombre_empleado} {empleado.apellido_empleado}
                </div>
                <div className="text-muted small d-md-none">
                  {empleado.email}
                </div>
              </td>

              <td className="d-none d-md-table-cell text-muted">
                {empleado.email}
              </td>

              <td className="d-none d-md-table-cell">
                {empleado.celular || (
                  <span className="text-muted fst-italic">Sin registrar</span>
                )}
              </td>

              <td className="d-none d-lg-table-cell">
                <span
                  className="font-monospace"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() =>
                    setPinVisible(pinOculto ? empleado.id_empleado : null)
                  }
                  title={pinOculto ? "Mostrar PIN" : "Ocultar PIN"}
                >
                  {empleado.pin
                    ? pinOculto
                      ? "•".repeat(empleado.pin.length)
                      : empleado.pin
                    : "-"}{" "}
                  {empleado.pin && (
                    <i className={`bi ${pinOculto ? "bi-eye" : "bi-eye-slash"} text-muted small`}></i>
                  )}
                </span>
              </td>

              <td>
                <span
                  className="badge rounded-pill"
                  style={{
                    background: rolEstilo.bg,
                    color: rolEstilo.color,
                    fontWeight: 600,
                    padding: "6px 12px",
                  }}
                >
                  {empleado.tipo_empleado}
                </span>
              </td>

              <td className="text-center">
                <button
                  className="btn-accion-moderno btn-accion-editar"
                  title="Editar empleado"
                  onClick={() => abrirModalEdicion(empleado)}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default TablaEmpleados;