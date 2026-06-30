import React from "react";
import { Table, Spinner } from "react-bootstrap";

const coloresPago = {
  efectivo: { bg: "rgba(25, 135, 84, 0.12)", color: "#198754" },
  tarjeta: { bg: "rgba(40, 137, 182, 0.12)", color: "#1e3d87" },
  transferencia: { bg: "rgba(111, 66, 193, 0.12)", color: "#6f42c1" },
};

const estiloPago = (metodo) => coloresPago[(metodo || "").toLowerCase()] || { bg: "rgba(108, 117, 125, 0.12)", color: "#6c757d" };

const TablaVentas = (props) => {
  const ventas = props.ventas || [];
  const cargando = props.cargando || false;
  const abrirEdicion = props.abrirEdicion;

  if (cargando) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <p className="mt-2 mb-0 text-muted">Cargando ventas...</p>
      </div>
    );
  }

  if (ventas.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <i className="bi bi-receipt"></i>
        <h5 className="mt-2">No hay ventas registradas.</h5>
      </div>
    );
  }

  return (
    <Table responsive size="sm" className="tabla-moderna mb-0">
      <thead>
        <tr>
          <th>ID</th>
          <th>Fecha</th>
          <th>Cliente</th>
          <th className="d-none d-lg-table-cell">Empleado</th>
          <th>Pago</th>
          <th className="text-end">Total</th>
          <th className="text-center">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {ventas.map(function (venta) {
          const nombreCliente = (venta.clientes ? venta.clientes.nombre_cliente + " " + (venta.clientes.apellido_cliente || "") : "Cliente no disponible");
          const nombreEmpleado = (venta.empleados ? venta.empleados.nombre_empleado + " " + (venta.empleados.apellido_empleado || "") : "—");
          const fecha = new Date(venta.fecha_venta).toLocaleDateString("es-NI");
          const hora = new Date(venta.fecha_venta).toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });
          const pago = estiloPago(venta.metodo_pago);
          const clickEditar = function () { abrirEdicion(venta); };

          return (
            <tr key={venta.id_venta}>
              <td><span className="badge-id-moderno">#{venta.id_venta}</span></td>
              <td>
                <div className="fw-semibold" style={{ color: "#1e2a5e" }}>{fecha}</div>
                <div className="text-muted small">{hora}</div>
              </td>
              <td>
                <div className="fw-semibold" style={{ color: "#1e2a5e" }}>{nombreCliente}</div>
                <div className="text-muted small d-lg-none">{nombreEmpleado}</div>
              </td>
              <td className="d-none d-lg-table-cell text-muted">{nombreEmpleado}</td>
              <td>
                <span className="badge rounded-pill" style={{ background: pago.bg, color: pago.color, fontWeight: 600, padding: "6px 12px" }}>{venta.metodo_pago}</span>
              </td>
              <td className="text-end fw-bold" style={{ color: "#198754" }}>C$ {parseFloat(venta.total || 0).toFixed(2)}</td>
              <td className="text-center">
                <button className="btn-accion-moderno btn-accion-editar" title="Editar venta" onClick={clickEditar}><i className="bi bi-pencil"></i></button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export default TablaVentas;