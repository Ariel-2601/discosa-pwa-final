import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert } from "react-bootstrap";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { supabase } from "../database/supabaseconfig";

const COLORES = ["#0d6efd", "#198754", "#ffc107", "#dc3545", "#6f42c1", "#20c997"];

const Inicio = () => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState({
    totalProductos: 0,
    totalClientes: 0,
    totalEmpleados: 0,
    totalVentas: 0,
    montoTotalVentas: 0,
  });

  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasPorMetodoPago, setVentasPorMetodoPago] = useState([]);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      try {
        setCargando(true);

        const [resProductos, resClientes, resEmpleados, resVentas] = await Promise.all([
          supabase.from("productos").select("id_producto", { count: "exact", head: true }),
          supabase.from("clientes").select("id_cliente", { count: "exact", head: true }),
          supabase.from("empleados").select("id_empleado", { count: "exact", head: true }),
          supabase
            .from("ventas")
            .select("id_venta, fecha_venta, total, metodo_pago, detalles_ventas(cantidad, subtotal, id_producto, productos(nombre_producto))"),
        ]);

        if (resVentas.error) throw resVentas.error;

        const ventas = resVentas.data || [];

        // KPIs
        const montoTotal = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
        setKpis({
          totalProductos: resProductos.count || 0,
          totalClientes: resClientes.count || 0,
          totalEmpleados: resEmpleados.count || 0,
          totalVentas: ventas.length,
          montoTotalVentas: montoTotal,
        });

        // Ventas por mes (últimos meses con datos)
        const acumuladoMes = {};
        ventas.forEach((v) => {
          if (!v.fecha_venta) return;
          const fecha = new Date(v.fecha_venta);
          const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
          acumuladoMes[clave] = (acumuladoMes[clave] || 0) + Number(v.total || 0);
        });
        const ventasMesOrdenadas = Object.entries(acumuladoMes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([mes, total]) => ({ mes, total }));
        setVentasPorMes(ventasMesOrdenadas);

        // Top productos más vendidos (por cantidad)
        const acumuladoProducto = {};
        ventas.forEach((v) => {
          (v.detalles_ventas || []).forEach((d) => {
            const nombre = d.productos?.nombre_producto || "Producto sin nombre";
            acumuladoProducto[nombre] = (acumuladoProducto[nombre] || 0) + Number(d.cantidad || 0);
          });
        });
        const topProductosOrdenados = Object.entries(acumuladoProducto)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([nombre, cantidad]) => ({ nombre, cantidad }));
        setTopProductos(topProductosOrdenados);

        // Ventas por método de pago
        const acumuladoMetodo = {};
        ventas.forEach((v) => {
          const metodo = v.metodo_pago || "Sin especificar";
          acumuladoMetodo[metodo] = (acumuladoMetodo[metodo] || 0) + 1;
        });
        const metodoPagoData = Object.entries(acumuladoMetodo).map(([metodo, cantidad]) => ({
          name: metodo,
          value: cantidad,
        }));
        setVentasPorMetodoPago(metodoPagoData);

      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, []);

  const tarjetaKpi = (titulo, valor, icono, color) => (
    <Col xs={6} md={3} className="mb-3">
      <Card className="text-center shadow-sm h-100">
        <Card.Body>
          <i className={`bi ${icono} mb-2`} style={{ fontSize: "1.8rem", color }}></i>
          <h4 className="mb-0">{valor}</h4>
          <small className="text-muted">{titulo}</small>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container className="mt-3">
      <Row className="align-items-center mb-3">
        <Col>
          <h2><i className="bi-house-fill me-2"></i> Inicio</h2>
          <p className="text-muted mb-0">Resumen general del sistema</p>
        </Col>
      </Row>

      {cargando && (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Cargando estadísticas...</p>
          </Col>
        </Row>
      )}

      {error && (
        <Alert variant="danger" className="text-center">{error}</Alert>
      )}

      {!cargando && !error && (
        <>
          {/* KPIs */}
          <Row>
            {tarjetaKpi("Productos", kpis.totalProductos, "bi-box-seam", "#0d6efd")}
            {tarjetaKpi("Clientes", kpis.totalClientes, "bi-people-fill", "#198754")}
            {tarjetaKpi("Empleados", kpis.totalEmpleados, "bi-person-badge-fill", "#ffc107")}
            {tarjetaKpi("Ventas realizadas", kpis.totalVentas, "bi-cart-check-fill", "#dc3545")}
          </Row>

          <Row className="mb-3">
            <Col>
              <Card className="shadow-sm">
                <Card.Body className="text-center">
                  <h5 className="mb-0">
                    Monto total vendido: C$ {kpis.montoTotalVentas.toLocaleString("es-NI", { minimumFractionDigits: 2 })}
                  </h5>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* GRÁFICOS */}
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>Ventas por mes</Card.Title>
                  {ventasPorMes.length === 0 ? (
                    <Alert variant="info" className="text-center mb-0">Aún no hay ventas registradas.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={ventasPorMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" stroke="#0d6efd" strokeWidth={2} name="Total vendido" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>Productos más vendidos</Card.Title>
                  {topProductos.length === 0 ? (
                    <Alert variant="info" className="text-center mb-0">Aún no hay datos de ventas.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={topProductos}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nombre" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#198754" name="Unidades vendidas" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title>Ventas por método de pago</Card.Title>
                  {ventasPorMetodoPago.length === 0 ? (
                    <Alert variant="info" className="text-center mb-0">Aún no hay ventas registradas.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={ventasPorMetodoPago}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                        >
                          {ventasPorMetodoPago.map((_, indice) => (
                            <Cell key={indice} fill={COLORES[indice % COLORES.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Inicio;
