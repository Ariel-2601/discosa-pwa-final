import React, { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Spinner, Alert, Form, Button, Badge } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import TarjetaCatalogo from "../components/catalogo/TarjetaCatalogo";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

const Catalogo = () => {

  // 🔹 Estados
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("todas");
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [orden, setOrden] = useState("nombre_asc");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Paginación
  const [paginaActual, establecerPaginaActual] = useState(1);
  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(8);

  // 🔹 Cargar datos
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const [resProductos, resCategorias] = await Promise.all([
        supabase
          .from("productos")
          .select("*")
          .order("nombre_producto", { ascending: true }),

        supabase
          .from("categorias")
          .select("id_categoria, nombre_categoria")
          .order("nombre_categoria", { ascending: true }),
      ]);

      if (resProductos.error) throw resProductos.error;
      if (resCategorias.error) throw resCategorias.error;

      setProductos(resProductos.data || []);
      setCategorias(resCategorias.data || []);

    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los productos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 🔹 Eventos
  const manejarCambioCategoria = (e) => {
    setCategoriaSeleccionada(e.target.value);
    establecerPaginaActual(1);
  };

  const manejarCambioBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
    establecerPaginaActual(1);
  };

  const manejarCambioOrden = (e) => {
    setOrden(e.target.value);
    establecerPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada("todas");
    setTextoBusqueda("");
    setOrden("nombre_asc");
    establecerPaginaActual(1);
  };

  const hayFiltrosActivos =
    categoriaSeleccionada !== "todas" || textoBusqueda.trim() !== "";

  // 🔹 Obtener nombre categoría
  const obtenerNombreCategoria = (idCategoria) => {
    const cat = categorias.find((c) => c.id_categoria === idCategoria);
    return cat ? cat.nombre_categoria : "Sin categoría";
  };

  // 🔹 Filtrado + orden
  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos];

    if (categoriaSeleccionada !== "todas") {
      filtrados = filtrados.filter(
        (p) => p.categoria_producto === parseInt(categoriaSeleccionada)
      );
    }

    if (textoBusqueda.trim()) {
      const texto = textoBusqueda.toLowerCase();

      filtrados = filtrados.filter((p) => {
        const nombre = p.nombre_producto?.toLowerCase() || "";
        const descripcion = p.descripcion_producto?.toLowerCase() || "";
        const precio = p.precio_venta?.toString() || "";

        return (
          nombre.includes(texto) ||
          descripcion.includes(texto) ||
          precio.includes(texto)
        );
      });
    }

    switch (orden) {
      case "nombre_asc":
        filtrados.sort((a, b) =>
          (a.nombre_producto || "").localeCompare(b.nombre_producto || "")
        );
        break;
      case "nombre_desc":
        filtrados.sort((a, b) =>
          (b.nombre_producto || "").localeCompare(a.nombre_producto || "")
        );
        break;
      case "precio_asc":
        filtrados.sort(
          (a, b) => (a.precio_venta || 0) - (b.precio_venta || 0)
        );
        break;
      case "precio_desc":
        filtrados.sort(
          (a, b) => (b.precio_venta || 0) - (a.precio_venta || 0)
        );
        break;
      default:
        break;
    }

    return filtrados;
  }, [productos, categoriaSeleccionada, textoBusqueda, orden]);

  // 🔹 Paginación sobre el resultado filtrado
  const productosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    return productosFiltrados.slice(inicio, inicio + registrosPorPagina);
  }, [productosFiltrados, paginaActual, registrosPorPagina]);

  return (
    <Container className="mt-3 mb-5">

      {/* HEADER MODERNO */}
      <div className="encabezado-pagina text-center">
        <h2 className="mb-1">
          <i className="bi bi-grid-fill me-2"></i>Catálogo
        </h2>
        <div className="subtitulo-pagina">
          Explora nuestros productos
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="tarjeta-contenido">

        {/* FILTROS */}
        <Row className="mb-2 g-2 align-items-end">

          {/* Categoría */}
          <Col xs={12} md={3}>
            <Form.Label className="small text-muted mb-1">Categoría</Form.Label>
            <Form.Select
              value={categoriaSeleccionada}
              onChange={manejarCambioCategoria}
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((cat) => (
                <option key={cat.id_categoria} value={cat.id_categoria}>
                  {cat.nombre_categoria}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Orden */}
          <Col xs={12} md={3}>
            <Form.Label className="small text-muted mb-1">Ordenar por</Form.Label>
            <Form.Select value={orden} onChange={manejarCambioOrden}>
              <option value="nombre_asc">Nombre (A-Z)</option>
              <option value="nombre_desc">Nombre (Z-A)</option>
              <option value="precio_asc">Precio (menor a mayor)</option>
              <option value="precio_desc">Precio (mayor a menor)</option>
            </Form.Select>
          </Col>

          {/* Busqueda */}
          <Col xs={12} md={5}>
            <Form.Label className="small text-muted mb-1">Buscar</Form.Label>
            <div className="buscador-moderno">
              <CuadroBusquedas
                textoBusqueda={textoBusqueda}
                manejarCambioBusqueda={manejarCambioBusqueda}
              />
            </div>
          </Col>

          {/* Limpiar filtros */}
          <Col xs={12} md={1} className="d-flex">
            <Button
              variant="outline-secondary"
              className="w-100"
              onClick={limpiarFiltros}
              disabled={!hayFiltrosActivos && orden === "nombre_asc"}
              title="Limpiar filtros"
            >
              <i className="bi bi-x-lg"></i>
            </Button>
          </Col>

        </Row>

        {/* CONTADOR DE RESULTADOS */}
        {!cargando && !error && (
          <Row className="mb-3">
            <Col>
              <Badge bg="light" text="dark" className="border">
                {productosFiltrados.length} producto
                {productosFiltrados.length !== 1 && "s"} encontrado
                {productosFiltrados.length !== 1 && "s"}
              </Badge>
            </Col>
          </Row>
        )}

        {/* LOADING */}
        {cargando && (
          <Row className="text-center mt-5">
            <Col>
              <Spinner animation="border" style={{ color: "#2889b6" }} />
              <p className="mt-2">Cargando productos...</p>
            </Col>
          </Row>
        )}

        {/* ERROR */}
        {error && (
          <Alert variant="danger" className="text-center">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="outline-danger" onClick={cargarDatos}>
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {/* SIN RESULTADOS */}
        {!cargando && !error && productosFiltrados.length === 0 && (
          <Alert variant="info" className="text-center">
            <i className="bi bi-search me-2"></i>
            No se encontraron productos con los filtros seleccionados.
            {hayFiltrosActivos && (
              <div className="mt-2">
                <Button size="sm" variant="outline-info" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </Alert>
        )}

        {/* PRODUCTOS */}
        {!cargando && !error && productosFiltrados.length > 0 && (
          <>
            <Row className="g-3">
              {productosPaginados.map((producto) => (
                <Col key={producto.id_producto} xs={6} md={4} lg={3}>
                  <TarjetaCatalogo
                    producto={producto}
                    categoriaNombre={obtenerNombreCategoria(
                      producto.categoria_producto
                    )}
                  />
                </Col>
              ))}
            </Row>

            <Paginacion
              registrosPorPagina={registrosPorPagina}
              totalRegistros={productosFiltrados.length}
              paginaActual={paginaActual}
              establecerPaginaActual={establecerPaginaActual}
              establecerRegistrosPorPagina={establecerRegistrosPorPagina}
            />
          </>
        )}

      </div>

    </Container>
  );
};

export default Catalogo;