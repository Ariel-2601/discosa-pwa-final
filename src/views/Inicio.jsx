import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from "react-bootstrap";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { supabase } from "../database/supabaseconfig";
import Paginacion from "../components/ordenamiento/Paginacion";


const COLORES = ["#121b96", "#2889b6", "#2697cc", "#ffc107", "#198754", "#dc3545"];

const COLOR_METODO_PAGO = {
  efectivo: { bg: "#e7f6ec", color: "#198754" },
  tarjeta: { bg: "#e8f1ff", color: "#1068db" },
  transferencia: { bg: "#fff3e0", color: "#fd7e14" },
};

const formatoCordoba = (valor) =>
  `C$ ${Number(valor || 0).toLocaleString("es-NI", { minimumFractionDigits: 2 })}`;

const obtenerIniciales = (nombre = "", apellido = "") =>
  `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || "?";

const Inicio = () => {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState({
    totalProductos: 0,
    totalClientes: 0,
    totalEmpleados: 0,
    totalVentas: 0,
    montoTotalVentas: 0,
    ticketPromedio: 0,
  });

  const [ventasPorMes, setVentasPorMes] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasPorMetodoPago, setVentasPorMetodoPago] = useState([]);
  const [topClientes, setTopClientes] = useState([]);

  // Tabla de ventas (paginada)
  const [ventasTabla, setVentasTabla] = useState([]);
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

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
            .select(`
              id_venta, fecha_venta, total, metodo_pago,
              clientes (id_cliente, nombre_cliente, apellido_cliente),
              detalles_ventas (cantidad, subtotal, id_producto, productos (nombre_producto))
            `)
            .order("fecha_venta", { ascending: false }),
        ]);

        if (resVentas.error) throw resVentas.error;

        const ventas = resVentas.data || [];

        // ---------- KPIs ----------
        const montoTotal = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
        setKpis({
          totalProductos: resProductos.count || 0,
          totalClientes: resClientes.count || 0,
          totalEmpleados: resEmpleados.count || 0,
          totalVentas: ventas.length,
          montoTotalVentas: montoTotal,
          ticketPromedio: ventas.length ? montoTotal / ventas.length : 0,
        });

        // ---------- Ventas por mes ----------
        const nombresMes = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const acumuladoMes = {};
        ventas.forEach((v) => {
          if (!v.fecha_venta) return;
          const fecha = new Date(v.fecha_venta);
          const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
          if (!acumuladoMes[clave]) {
            acumuladoMes[clave] = { total: 0, etiqueta: `${nombresMes[fecha.getMonth()]} ${fecha.getFullYear()}` };
          }
          acumuladoMes[clave].total += Number(v.total || 0);
        });
        const ventasMesOrdenadas = Object.entries(acumuladoMes)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, valor]) => ({ mes: valor.etiqueta, total: valor.total }));
        setVentasPorMes(ventasMesOrdenadas);

        // ---------- Top productos ----------
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

        // ---------- Métodos de pago ----------
        const acumuladoMetodo = {};
        ventas.forEach((v) => {
          const metodo = v.metodo_pago || "Sin especificar";
          acumuladoMetodo[metodo] = (acumuladoMetodo[metodo] || 0) + 1;
        });
        setVentasPorMetodoPago(
          Object.entries(acumuladoMetodo).map(([metodo, cantidad]) => ({ name: metodo, value: cantidad }))
        );

        // ---------- Top clientes por gasto ----------
        const acumuladoCliente = {};
        ventas.forEach((v) => {
          if (!v.clientes) return;
          const id = v.clientes.id_cliente;
          if (!acumuladoCliente[id]) {
            acumuladoCliente[id] = {
              nombre: v.clientes.nombre_cliente,
              apellido: v.clientes.apellido_cliente || "",
              monto: 0,
            };
          }
          acumuladoCliente[id].monto += Number(v.total || 0);
        });
        const topClientesOrdenados = Object.values(acumuladoCliente)
          .sort((a, b) => b.monto - a.monto)
          .slice(0, 5);
        setTopClientes(topClientesOrdenados);

        // ---------- Tabla de ventas (historial completo, paginado) ----------
        setVentasTabla(ventas);
        establecerPaginaActual(1);

      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las estadísticas.");
      } finally {
        setCargando(false);
      }
    };

    cargarEstadisticas();
  }, []);

  // Página de ventas a mostrar en la tabla
  const ventasPaginadas = ventasTabla.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  const fechaHoy = new Date().toLocaleDateString("es-NI", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tarjetaKpi = (titulo, valor, icono, gradiente) => (
    <Col xs={6} lg={3} className="mb-3">
      <Card className="kpi-tarjeta h-100">
        <Card.Body className="d-flex align-items-center gap-3">
          <div className="kpi-icono" style={{ backgroundImage: gradiente }}>
            <i className={`bi ${icono}`}></i>
          </div>
          <div>
            <p className="kpi-valor">{valor}</p>
            <span className="kpi-etiqueta">{titulo}</span>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container fluid className="mt-3 px-3 px-lg-4">
      {/* ---------- HERO ---------- */}
      <div className="inicio-hero mb-4">
        <Row className="align-items-center position-relative">
          <Col md={8}>
            <p className="inicio-hero-saludo">Panel de control</p>
            <h2 className="inicio-hero-titulo">¡Bienvenido de vuelta! 👋</h2>
            <p className="inicio-hero-fecha mb-0">{fechaHoy}</p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <p className="inicio-hero-monto-label mb-1">Total vendido</p>
            <p className="inicio-hero-monto mb-0">{formatoCordoba(kpis.montoTotalVentas)}</p>
          </Col>
        </Row>
      </div>

      {cargando && (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" style={{ color: "#121b96" }} />
            <p className="mt-3 text-muted">Cargando estadísticas...</p>
          </Col>
        </Row>
      )}

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      {!cargando && !error && (
        <>
          {/* ---------- KPIs ---------- */}
          <Row>
            {tarjetaKpi("Productos", kpis.totalProductos, "bi-box-seam-fill", "linear-gradient(135deg,#121b96,#2889b6)")}
            {tarjetaKpi("Clientes", kpis.totalClientes, "bi-people-fill", "linear-gradient(135deg,#198754,#20c997)")}
            {tarjetaKpi("Empleados", kpis.totalEmpleados, "bi-person-badge-fill", "linear-gradient(135deg,#fd7e14,#ffc107)")}
            {tarjetaKpi("Ticket promedio", formatoCordoba(kpis.ticketPromedio), "bi-receipt", "linear-gradient(135deg,#6f42c1,#dc3545)")}
          </Row>

          {/* ---------- GRÁFICOS PRINCIPALES ---------- */}
          <Row className="mt-1">
            <Col lg={7} className="mb-4">
              <Card className="panel-tarjeta">
                <Card.Body>
                  <p className="panel-titulo">Tendencia de ventas</p>
                  <p className="panel-subtitulo">Monto total vendido por mes</p>
                  {ventasPorMes.length === 0 ? (
                    <Alert variant="light" className="text-center mb-0 border">Aún no hay ventas registradas.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={ventasPorMes}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#121b96" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#121b96" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f1f6" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(valor) => formatoCordoba(valor)} />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#121b96"
                          strokeWidth={3}
                          fill="url(#colorTotal)"
                          name="Total vendido"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5} className="mb-4">
              <Card className="panel-tarjeta">
                <Card.Body>
                  <p className="panel-titulo">Métodos de pago</p>
                  <p className="panel-subtitulo">Distribución de ventas por forma de pago</p>
                  {ventasPorMetodoPago.length === 0 ? (
                    <Alert variant="light" className="text-center mb-0 border">Aún no hay ventas registradas.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={ventasPorMetodoPago}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {ventasPorMetodoPago.map((_, indice) => (
                            <Cell key={indice} fill={COLORES[indice % COLORES.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ---------- TOP PRODUCTOS Y CLIENTES ---------- */}
          <Row>
            <Col lg={7} className="mb-4">
              <Card className="panel-tarjeta">
                <Card.Body>
                  <p className="panel-titulo">Productos más vendidos</p>
                  <p className="panel-subtitulo">Top 5 por unidades vendidas</p>
                  {topProductos.length === 0 ? (
                    <Alert variant="light" className="text-center mb-0 border">Aún no hay datos de ventas.</Alert>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={topProductos} layout="vertical" margin={{ left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f1f6" />
                        <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis type="category" dataKey="nombre" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                        <Tooltip />
                        <Bar dataKey="cantidad" name="Unidades vendidas" radius={[0, 8, 8, 0]}>
                          {topProductos.map((_, indice) => (
                            <Cell key={indice} fill={COLORES[indice % COLORES.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5} className="mb-4">
              <Card className="panel-tarjeta">
                <Card.Body>
                  <p className="panel-titulo">Mejores clientes</p>
                  <p className="panel-subtitulo">Top 5 por monto total comprado</p>
                  {topClientes.length === 0 ? (
                    <Alert variant="light" className="text-center mb-0 border">Aún no hay clientes con compras.</Alert>
                  ) : (
                    <div>
                      {topClientes.map((cliente, indice) => (
                        <div className="cliente-fila" key={indice}>
                          <div className="cliente-avatar">
                            {obtenerIniciales(cliente.nombre, cliente.apellido)}
                          </div>
                          <div className="flex-grow-1">
                            <div className="cliente-nombre">{cliente.nombre} {cliente.apellido}</div>
                          </div>
                          <div className="cliente-monto">{formatoCordoba(cliente.monto)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ---------- HISTORIAL DE VENTAS (PAGINADO) ---------- */}
          <Row>
            <Col className="mb-4">
              <Card className="panel-tarjeta">
                <Card.Body>
                  <p className="panel-titulo">Historial de ventas</p>
                  <p className="panel-subtitulo">Todas las operaciones registradas</p>
                  {ventasTabla.length === 0 ? (
                    <Alert variant="light" className="text-center mb-0 border">Aún no hay ventas registradas.</Alert>
                  ) : (
                    <>
                      <div className="table-responsive">
                        <Table className="tabla-ventas-recientes mb-0" borderless>
                          <thead>
                            <tr>
                              <th>Cliente</th>
                              <th>Fecha</th>
                              <th>Método de pago</th>
                              <th className="text-end">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ventasPaginadas.map((venta) => {
                              const estilo = COLOR_METODO_PAGO[venta.metodo_pago] || { bg: "#eef0f6", color: "#5a5f73" };
                              return (
                                <tr key={venta.id_venta}>
                                  <td>
                                    {venta.clientes
                                      ? `${venta.clientes.nombre_cliente} ${venta.clientes.apellido_cliente || ""}`
                                      : "Cliente eliminado"}
                                  </td>
                                  <td>
                                    {new Date(venta.fecha_venta).toLocaleDateString("es-NI", {
                                      day: "2-digit", month: "short", year: "numeric",
                                    })}
                                  </td>
                                  <td>
                                    <Badge
                                      className="badge-metodo-pago"
                                      style={{ backgroundColor: estilo.bg, color: estilo.color }}
                                    >
                                      {venta.metodo_pago || "Sin especificar"}
                                    </Badge>
                                  </td>
                                  <td className="text-end fw-semibold">{formatoCordoba(venta.total)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>

                      <Paginacion
                        registrosPorPagina={registrosPorPagina}
                        totalRegistros={ventasTabla.length}
                        paginaActual={paginaActual}
                        establecerPaginaActual={establecerPaginaActual}
                        establecerRegistrosPorPagina={establecerRegistrosPorPagina}
                      />
                    </>
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
