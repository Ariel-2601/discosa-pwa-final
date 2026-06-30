import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import TablaVentas from "../components/ventas/TablaVentas";
import TarjetaVenta from "../components/ventas/TarjetaVenta";
import FormularioVenta from "../components/ventas/FormularioVenta";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Ventas = () => {
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [ventaAEditar, setVentaAEditar] = useState(null);

  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productos, setProductos] = useState([]);

  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [detalles, setDetalles] = useState([]);
  const [totalGeneral, setTotalGeneral] = useState(0);

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(8);
  const [paginaActual, establecerPaginaActual] = useState(1);

  const ventasPaginadas = ventasFiltradas.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  // Cargar datos
  const cargarDatosAuxiliares = async () => {
    try {
      const [c, e, p] = await Promise.all([
        supabase.from("clientes").select("*"),
        supabase.from("empleados").select("*"),
        supabase.from("productos").select("*")
      ]);
      setClientes(c.data || []);
      setEmpleados(e.data || []);
      setProductos(p.data || []);
    } catch (err) {
      console.error("Error cargando auxiliares:", err);
    }
  };

  const cargarVentas = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("ventas")
        .select(`
          *,
          clientes (nombre_cliente, apellido_cliente),
          empleados (nombre_empleado, apellido_empleado),
          detalles_ventas (*, productos (nombre_producto))
        `)
        .order("fecha_venta", { ascending: false });

      if (error) {
        console.error("Error al cargar ventas:", error);
        setToast({ mostrar: true, mensaje: "Error al cargar ventas", tipo: "error" });
        return;
      }
      setVentas(data || []);
    } catch (err) {
      console.error(err);
      setToast({ mostrar: true, mensaje: "Error inesperado al cargar ventas", tipo: "error" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVentas();
    cargarDatosAuxiliares();
  }, []);

  // Precargar formulario al editar
  useEffect(() => {
    if (ventaAEditar) {
      const cliente = clientes.find(c => c.id_cliente === ventaAEditar.id_cliente);
      const empleado = empleados.find(e => e.id_empleado === ventaAEditar.id_empleado);

      setClienteSeleccionado(cliente || null);
      setEmpleadoSeleccionado(empleado || null);
      setMetodoPago(ventaAEditar.metodo_pago || "efectivo");

      if (ventaAEditar.detalles_ventas?.length > 0) {
        const detallesFormateados = ventaAEditar.detalles_ventas.map(d => ({
          id_producto: d.id_producto,
          nombre_producto: d.productos?.nombre_producto || "Producto",
          precio: d.precio_unitario,
          cantidad: d.cantidad
        }));
        setDetalles(detallesFormateados);
      } else {
        setDetalles([]);
      }
    }
  }, [ventaAEditar, clientes, empleados]);

  // Calcular total
  useEffect(() => {
    const total = detalles.reduce((sum, det) => sum + (det.cantidad * det.precio), 0);
    setTotalGeneral(total);
  }, [detalles]);

  // Búsqueda
  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setVentasFiltradas(ventas);
    } else {
      const textoLower = textoBusqueda.toLowerCase();
      const filtradas = ventas.filter(v =>
        `${v.clientes?.nombre_cliente || ''} ${v.clientes?.apellido_cliente || ''}`.toLowerCase().includes(textoLower) ||
        v.empleados?.nombre_empleado?.toLowerCase().includes(textoLower)
      );
      setVentasFiltradas(filtradas);
    }
  }, [textoBusqueda, ventas]);

  const abrirNuevaVenta = () => {
    resetFormulario();
    setMostrarFormulario(true);
  };

  const abrirEdicion = (venta) => {
    setVentaAEditar(venta);
    setMostrarFormulario(true);
  };

  const resetFormulario = () => {
    setClienteSeleccionado(null);
    setEmpleadoSeleccionado(null);
    setMetodoPago("efectivo");
    setDetalles([]);
    setVentaAEditar(null);
  };

  const agregarDetalle = (producto, cantidad) => {
    if (!producto || !cantidad) return;
    setDetalles(prev => {
      const existe = prev.find(d => d.id_producto === producto.id_producto);
      if (existe) {
        return prev.map(d =>
          d.id_producto === producto.id_producto ? { ...d, cantidad: d.cantidad + cantidad } : d
        );
      }
      return [...prev, {
        id_producto: producto.id_producto,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio_venta,
        cantidad
      }];
    });
  };

  const eliminarDetalle = (id_producto) => {
    setDetalles(prev => prev.filter(d => d.id_producto !== id_producto));
  };

  const actualizarCantidad = (id_producto, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setDetalles(prev => prev.map(d =>
      d.id_producto === id_producto ? { ...d, cantidad: nuevaCantidad } : d
    ));
  };

  const guardarVenta = async () => {
    if (!clienteSeleccionado || !empleadoSeleccionado || detalles.length === 0) {
      setToast({ mostrar: true, mensaje: "Faltan datos obligatorios", tipo: "advertencia" });
      return;
    }

    try {
      if (ventaAEditar) {
        // === ACTUALIZAR ===
        await supabase.from("ventas").update({
          id_cliente: clienteSeleccionado.id_cliente,
          id_empleado: empleadoSeleccionado.id_empleado,
          metodo_pago: metodoPago,
          total: totalGeneral
        }).eq("id_venta", ventaAEditar.id_venta);

        await supabase.from("detalles_ventas").delete().eq("id_venta", ventaAEditar.id_venta);

        const detallesInsert = detalles.map(d => ({
          id_venta: ventaAEditar.id_venta,
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio,
          subtotal: d.cantidad * d.precio
        }));

        await supabase.from("detalles_ventas").insert(detallesInsert);

        setToast({ mostrar: true, mensaje: "Venta actualizada exitosamente", tipo: "exito" });
      } else {
        // === NUEVA VENTA ===
        const nicaNow = () => new Date().toLocaleString("sv", { timeZone: "America/Managua" }).replace(" ", "T");

        const { data: ventaData } = await supabase
          .from("ventas")
          .insert([{
            id_cliente: clienteSeleccionado.id_cliente,
            id_empleado: empleadoSeleccionado.id_empleado,
            fecha_venta: nicaNow(),
            metodo_pago: metodoPago,
            total: totalGeneral
          }])
          .select()
          .single();

        const detallesInsert = detalles.map(d => ({
          id_venta: ventaData.id_venta,
          id_producto: d.id_producto,
          cantidad: d.cantidad,
          precio_unitario: d.precio,
          subtotal: d.cantidad * d.precio
        }));

        await supabase.from("detalles_ventas").insert(detallesInsert);

        setToast({ mostrar: true, mensaje: "Venta registrada exitosamente", tipo: "exito" });
      }

      resetFormulario();
      setMostrarFormulario(false);
      await cargarVentas();

    } catch (err) {
      console.error(err);
      setToast({ mostrar: true, mensaje: "Error al guardar la venta", tipo: "error" });
    }
  };

  const manejarBusqueda = (e) => setTextoBusqueda(e.target.value);

  const totalVentasFiltradas = ventasFiltradas.reduce(
    (suma, v) => suma + (parseFloat(v.total) || 0),
    0
  );

  // 📄 PDF GENERAL DE VENTAS
  const generarPDFVentas = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Reporte General de Ventas", 14, 20);

    doc.line(14, 25, 195, 25);

    autoTable(doc, {
      startY: 32,
      head: [["ID", "Fecha", "Cliente", "Empleado", "Método de Pago", "Total"]],
      body: ventasFiltradas.map((v) => [
        v.id_venta,
        v.fecha_venta
          ? new Date(v.fecha_venta).toLocaleString("es-NI", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "",
        `${v.clientes?.nombre_cliente || ""} ${v.clientes?.apellido_cliente || ""}`.trim(),
        `${v.empleados?.nombre_empleado || ""} ${v.empleados?.apellido_empleado || ""}`.trim(),
        v.metodo_pago || "",
        `C$ ${parseFloat(v.total || 0).toFixed(2)}`,
      ]),
      headStyles: { fillColor: [40, 137, 182] },
      styles: { fontSize: 9, cellPadding: 3 },
      foot: [["", "", "", "", "Total General", `C$ ${totalVentasFiltradas.toFixed(2)}`]],
      footStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: "bold" },
    });

    doc.save("reporte_ventas.pdf");
  };

  return (
    <Container className="mt-3">

      {/* HEADER MODERNO */}
      <div className="encabezado-pagina d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="mb-0">
            <i className="bi bi-receipt-cutoff me-2"></i> Ventas
          </h3>
          <div className="subtitulo-pagina">
            {ventasFiltradas.length} venta{ventasFiltradas.length !== 1 && "s"} · C$ {totalVentasFiltradas.toFixed(2)} en total
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="light"
            className="btn-encabezado-pagina"
            onClick={generarPDFVentas}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i>
            <span className="d-none d-sm-inline">Descargar PDF</span>
          </Button>

          <Button className="btn-encabezado-pagina" onClick={abrirNuevaVenta}>
            <i className="bi bi-plus-lg me-2"></i>
            <span className="d-none d-sm-inline">Nueva Venta</span>
          </Button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="tarjeta-contenido">

        {/* BUSCADOR */}
        <Row className="mb-4">
          <Col md={6} lg={5}>
            <div className="buscador-moderno">
              <CuadroBusquedas
                textoBusqueda={textoBusqueda}
                manejarCambioBusqueda={manejarBusqueda}
                placeholder="Buscar por cliente o empleado..."
              />
            </div>
          </Col>
        </Row>

        {/* SIN RESULTADOS */}
        {!cargando && textoBusqueda.trim() && ventasFiltradas.length === 0 && (
          <Alert variant="info" className="text-center">
            <i className="bi bi-info-circle me-2"></i>
            No se encontraron ventas que coincidan con "{textoBusqueda}".
          </Alert>
        )}

        {/* TABLA / TARJETAS */}
        {(cargando || ventasFiltradas.length > 0) && (
          <Row>
            <Col xs={12} className="d-lg-none">
              <TarjetaVenta
                ventas={ventasPaginadas}
                cargando={cargando}
                abrirEdicion={abrirEdicion}
              />
            </Col>
            <Col lg={12} className="d-none d-lg-block">
              <TablaVentas
                ventas={ventasPaginadas}
                cargando={cargando}
                abrirEdicion={abrirEdicion}
              />
            </Col>
          </Row>
        )}

        {/* PAGINACIÓN */}
        {ventasFiltradas.length > 0 && (
          <Paginacion
            registrosPorPagina={registrosPorPagina}
            totalRegistros={ventasFiltradas.length}
            paginaActual={paginaActual}
            establecerPaginaActual={establecerPaginaActual}
            establecerRegistrosPorPagina={establecerRegistrosPorPagina}
          />
        )}

      </div>

      <FormularioVenta
        mostrar={mostrarFormulario}
        setMostrar={setMostrarFormulario}
        clientes={clientes}
        empleados={empleados}
        productos={productos}
        clienteSeleccionado={clienteSeleccionado}
        setClienteSeleccionado={setClienteSeleccionado}
        empleadoSeleccionado={empleadoSeleccionado}
        setEmpleadoSeleccionado={setEmpleadoSeleccionado}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        detalles={detalles}
        totalGeneral={totalGeneral}
        agregarDetalle={agregarDetalle}
        eliminarDetalle={eliminarDetalle}
        actualizarCantidad={actualizarCantidad}
        guardarVenta={guardarVenta}
        ventaAEditar={ventaAEditar}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Ventas;