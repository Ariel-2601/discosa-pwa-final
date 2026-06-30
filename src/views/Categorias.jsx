import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

import ModalRegistroCategoria from "../components/categorias/ModalRegistroCategoria";
import ModalEdicionCategoria from "../components/categorias/ModalEdicionCategoria";
import ModalEliminacionCategoria from "../components/categorias/ModalEliminacionCategoria";

import TablaCategorias from "../components/categorias/TablaCategorias";
import TarjetaCategoria from "../components/categorias/TarjetaCategoria";

import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Categorias = () => {

  const [toast, setToast] = useState({
    mostrar: false,
    mensaje: "",
    tipo: "",
  });

  const [mostrarModal, setMostrarModal] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre_categoria: "",
    descripcion_categoria: "",
  });

  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [categoriasFiltradas, setCategoriasFiltradas] = useState([]);

  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null);

  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  const [categoriaEditar, setCategoriaEditar] = useState({
    id_categoria: "",
    nombre_categoria: "",
    descripcion_categoria: "",
  });

  // PAGINACION
  const categoriasPaginadas = categoriasFiltradas.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  // CARGAR CATEGORIAS
  const cargarCategorias = async () => {

    try {

      setCargando(true);

      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id_categoria", { ascending: true });

      if (error) throw error;

      setCategorias(
        (data || []).map((item) => ({
          ...item,
          descripcion_categoria:
            item.descripcion_categoria ?? item.descripcion ?? "",
          nombre_categoria:
            item.nombre_categoria ?? item.nombre ?? "",
        }))
      );

    } catch (err) {

      console.error("Error al cargar categorías:", err.message);

      setToast({
        mostrar: true,
        mensaje: "Error al cargar categorías.",
        tipo: "error",
      });

    } finally {

      setCargando(false);
    }
  };

  // INICIALIZAR
  useEffect(() => {

    cargarCategorias();

  }, []);

  // FILTRO BUSQUEDA
  useEffect(() => {

    if (!textoBusqueda.trim()) {

      setCategoriasFiltradas(categorias);

    } else {

      const textoLower = textoBusqueda.toLowerCase().trim();

      const filtradas = categorias.filter(
        (cat) =>
          cat.nombre_categoria.toLowerCase().includes(textoLower) ||
          cat.descripcion_categoria.toLowerCase().includes(textoLower)
      );

      setCategoriasFiltradas(filtradas);
    }

  }, [textoBusqueda, categorias]);

  // BUSQUEDA
  const manejarBusqueda = (e) => {

    setTextoBusqueda(e.target.value);
  };

  // INPUT REGISTRO
  const manejoCambioInput = (e) => {

    const { name, value } = e.target;

    setNuevaCategoria((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // INPUT EDICION
  const manejoCambioInputEdicion = (e) => {

    const { name, value } = e.target;

    setCategoriaEditar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ABRIR MODAL EDICION
  const abrirModalEdicion = (categoria) => {

    setCategoriaEditar({
      id_categoria: categoria.id_categoria,
      nombre_categoria: categoria.nombre_categoria,
      descripcion_categoria:
        categoria.descripcion_categoria ?? "",
    });

    setMostrarModalEdicion(true);
  };

  // ABRIR MODAL ELIMINACION
  const abrirModalEliminacion = (categoria) => {

    setCategoriaAEliminar(categoria);
    setMostrarModalEliminacion(true);
  };

  // AGREGAR
  const agregarCategoria = async () => {

    try {

      if (
        !nuevaCategoria.nombre_categoria.trim() ||
        !nuevaCategoria.descripcion_categoria.trim()
      ) {

        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });

        return;
      }

      const { error } = await supabase
        .from("categorias")
        .insert([
          {
            nombre_categoria: nuevaCategoria.nombre_categoria,
            descripcion_categoria: nuevaCategoria.descripcion_categoria,
          },
        ]);

      if (error) throw error;

      setToast({
        mostrar: true,
        mensaje: "Categoría registrada correctamente.",
        tipo: "exito",
      });

      setNuevaCategoria({
        nombre_categoria: "",
        descripcion_categoria: "",
      });

      setMostrarModal(false);

      cargarCategorias();

    } catch (err) {

      console.error(err);

      setToast({
        mostrar: true,
        mensaje: "Error al registrar categoría.",
        tipo: "error",
      });
    }
  };

  // ACTUALIZAR
  const actualizarCategoria = async () => {

    try {

      if (
        !categoriaEditar.nombre_categoria.trim() ||
        !categoriaEditar.descripcion_categoria.trim()
      ) {

        setToast({
          mostrar: true,
          mensaje: "Debe llenar todos los campos.",
          tipo: "advertencia",
        });

        return;
      }

      const { error } = await supabase
        .from("categorias")
        .update({
          nombre_categoria: categoriaEditar.nombre_categoria,
          descripcion_categoria: categoriaEditar.descripcion_categoria,
        })
        .eq("id_categoria", categoriaEditar.id_categoria);

      if (error) throw error;

      setMostrarModalEdicion(false);

      cargarCategorias();

      setToast({
        mostrar: true,
        mensaje: "Categoría actualizada correctamente.",
        tipo: "exito",
      });

    } catch (err) {

      console.error(err);

      setToast({
        mostrar: true,
        mensaje: "Error al actualizar categoría.",
        tipo: "error",
      });
    }
  };

  // ELIMINAR
  const eliminarCategoria = async () => {

    try {

      if (!categoriaAEliminar) return;

      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id_categoria", categoriaAEliminar.id_categoria);

      if (error) throw error;

      setMostrarModalEliminacion(false);

      cargarCategorias();

      setToast({
        mostrar: true,
        mensaje: "Categoría eliminada correctamente.",
        tipo: "exito",
      });

    } catch (err) {

      console.error(err);

      setToast({
        mostrar: true,
        mensaje: "Error al eliminar categoría.",
        tipo: "error",
      });
    }
  };

  // 📄 PDF GENERAL DE CATEGORIAS
  const generarPDFCategorias = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Reporte General de Categorías", 14, 20);

    doc.line(14, 25, 195, 25);

    autoTable(doc, {
      startY: 32,
      head: [["ID", "Nombre", "Descripción"]],
      body: categoriasFiltradas.map((cat) => [
        cat.id_categoria,
        cat.nombre_categoria,
        cat.descripcion_categoria,
      ]),
      headStyles: { fillColor: [40, 137, 182] },
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save("reporte_categorias.pdf");
  };

return (
    <Container className="mt-3">

      {/* HEADER MODERNO */}
      <div className="encabezado-pagina d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h3 className="mb-0">
            <i className="bi-bookmark-plus-fill me-2"></i>
            Categorías
          </h3>
          <div className="subtitulo-pagina">
            Administra las categorías de tus productos
          </div>
        </div>

        <div className="d-flex gap-2">
          <Button
            variant="light"
            className="btn-encabezado-pagina"
            onClick={generarPDFCategorias}
          >
            <i className="bi bi-file-earmark-pdf me-2"></i>
            <span className="d-none d-sm-inline">Descargar PDF</span>
          </Button>

          <Button className="btn-encabezado-pagina" onClick={() => setMostrarModal(true)}>
            <i className="bi-plus-lg"></i>
            <span className="ms-2">Nueva Categoría</span>
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
                placeholder="Buscar por nombre o descripción..."
              />
            </div>
          </Col>
        </Row>

        {/* CARGANDO */}
        {cargando && (
          <Row className="text-center my-5">
            <Col>
              <Spinner animation="border" style={{ color: "#2889b6" }} />
              <p className="mt-3">Cargando categorías...</p>
            </Col>
          </Row>
        )}

        {/* SIN RESULTADOS */}
        {!cargando &&
          textoBusqueda.trim() &&
          categoriasFiltradas.length === 0 && (
            <Alert variant="info" className="text-center">
              No se encontraron categorías.
            </Alert>
        )}

        {/* TABLA */}
        {!cargando && categoriasFiltradas.length > 0 && (
          <Row>
            <Col xs={12} className="d-lg-none">
              <TarjetaCategoria
                categorias={categoriasPaginadas}
                abrirModalEdicion={abrirModalEdicion}
                abrirModalEliminacion={abrirModalEliminacion}
              />
            </Col>

            <Col lg={12} className="d-none d-lg-block">
              <TablaCategorias
                categorias={categoriasPaginadas}
                cargando={cargando}
                abrirModalEdicion={abrirModalEdicion}
                abrirModalEliminacion={abrirModalEliminacion}
              />
            </Col>
          </Row>
        )}

        {/* PAGINACION */}
        {categoriasFiltradas.length > 0 && (
          <Paginacion
            registrosPorPagina={registrosPorPagina}
            totalRegistros={categoriasFiltradas.length}
            paginaActual={paginaActual}
            establecerPaginaActual={establecerPaginaActual}
            establecerRegistrosPorPagina={establecerRegistrosPorPagina}
          />
        )}

      </div>

      {/* MODAL REGISTRO */}
      <ModalRegistroCategoria
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevaCategoria={nuevaCategoria}
        manejoCambioInput={manejoCambioInput}
        agregarCategoria={agregarCategoria}
      />

      {/* MODAL EDICION */}
      <ModalEdicionCategoria
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        categoriaEditar={categoriaEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        actualizarCategoria={actualizarCategoria}
      />

      {/* MODAL ELIMINACION */}
      <ModalEliminacionCategoria
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarCategoria={eliminarCategoria}
        categoria={categoriaAEliminar}
      />

      {/* TOAST */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() =>
          setToast((prev) => ({
            ...prev,
            mostrar: false,
          }))
        }
      />

    </Container>
  );
};

export default Categorias;