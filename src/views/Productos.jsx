import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import TablaProductos from "../components/productos/TablaProductos";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import TarjetaProductos from "../components/productos/TarjetasProductos";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Productos = () => {

    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [textoBusqueda, setTextoBusqueda] = useState("");

    // eliminacon
    const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
    const [productoAEliminar, setProductoAEliminar] = useState(null);

    // edicion 
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
    const [productoEditar, setProductoEditar] = useState({});

    const [mostrarModal, setMostrarModal] = useState(false);

    const [nuevoProducto, setNuevoProducto] = useState({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        archivo: null,
    });

    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    // 🔹 Cargar productos
    const cargarProductos = async () => {
        try {
            const { data, error } = await supabase
                .from("productos")
                .select("*");

            if (error) throw error;

            setProductos(data || []);
        } catch (err) {
            console.error("Error al cargar productos:", err);
        }
    };

    // 🔹 Cargar categorías
    const cargarCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from("categorias")
                .select("*")
                .order("id_categoria", { ascending: true });

            if (error) throw error;

            setCategorias(data || []);
        } catch (err) {
            console.error("Error al cargar categorías:", err);
        }
    };

    const convertirImagenBase64 = (url) => {
        return new Promise((resolve, reject) => {

            const img = new Image();

            img.crossOrigin = "Anonymous";

            img.onload = () => {

                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);

                resolve(canvas.toDataURL("image/jpeg"));
            };

            img.onerror = reject;

            img.src = url;
        });
    };


    // 📄 PDF GENERAL DE PRODUCTOS
    const generarPDFProductos = async () => {

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Reporte General de Productos", 14, 20);

        doc.line(14, 25, 195, 25);

        let y = 35;

        for (const prod of productosFiltrados) {

            // 📌 Datos
            doc.setFontSize(12);

            doc.text(`ID: ${prod.id_producto}`, 14, y);
            doc.text(`Nombre: ${prod.nombre_producto}`, 14, y + 8);
            doc.text(`Categoría: ${prod.categoria_producto}`, 14, y + 16);
            doc.text(
                `Precio: C$ ${parseFloat(prod.precio_venta).toFixed(2)}`,
                14,
                y + 24
            );

            // 📌 Imagen
            if (prod.url_imagen) {

                try {

                    const imgData = await convertirImagenBase64(prod.url_imagen);

                    doc.addImage(
                        imgData,
                        "JPEG",
                        130,
                        y,
                        40,
                        40
                    );

                } catch (error) {
                    console.log("Error cargando imagen");
                }
            }

            // 📌 Separación
            y += 55;

            // 📌 Nueva página
            if (y > 240) {
                doc.addPage();
                y = 20;
            }
        }

        doc.save("reporte_productos.pdf");
    };
    // 🔹 Filtrar productos
    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setProductosFiltrados(productos);
        } else {
            const textoLower = textoBusqueda.toLowerCase().trim();

            const filtrados = productos.filter((prod) => {
                const nombre = prod.nombre_producto?.toLowerCase() || "";
                const descripcion = prod.descripcion_producto?.toLowerCase() || "";
                const precio = prod.precio_venta?.toString() || "";

                return (
                    nombre.includes(textoLower) ||
                    descripcion.includes(textoLower) ||
                    precio.includes(textoLower)
                );
            });

            setProductosFiltrados(filtrados);
        }
    }, [textoBusqueda, productos]);

    // 🔹 Inicializar datos
    useEffect(() => {
        cargarCategorias();
        cargarProductos(); // 🔥 ESTA ERA LA CLAVE
    }, []);

    // 🔹 Inputs
    const manejoCambioInput = (e) => {
        const { name, value } = e.target;
        setNuevoProducto((prev) => ({ ...prev, [name]: value }));
    };

    const manejoCambioArchivo = (e) => {
        const archivo = e.target.files[0];

        if (archivo && archivo.type.startsWith("image/")) {
            setNuevoProducto((prev) => ({ ...prev, archivo }));
        } else {
            alert("Selecciona una imagen válida");
        }
    };

    const manejarBusqueda = (e) => {
        setTextoBusqueda(e.target.value);
    };

    // 🔹 Agregar producto
    const agregarProducto = async () => {
        try {
            if (
                !nuevoProducto.nombre_producto.trim() ||
                !nuevoProducto.categoria_producto ||
                !nuevoProducto.precio_venta ||
                !nuevoProducto.archivo
            ) {
                setToast({
                    mostrar: true,
                    mensaje: "Completa los campos obligatorios",
                    tipo: "advertencia",
                });
                return;
            }

            setMostrarModal(false);

            const nombreArchivo = `${Date.now()}-${nuevoProducto.archivo.name}`;

            const { error: uploadError } = await supabase.storage
                .from("imagenes_productos")
                .upload(nombreArchivo, nuevoProducto.archivo);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("imagenes_productos")
                .getPublicUrl(nombreArchivo);

            const urlPublica = urlData.publicUrl;

            const { error } = await supabase.from("productos").insert([
                {
                    nombre_producto: nuevoProducto.nombre_producto,
                    descripcion_producto: nuevoProducto.descripcion_producto || null,
                    categoria_producto: nuevoProducto.categoria_producto,
                    precio_venta: parseFloat(nuevoProducto.precio_venta),
                    url_imagen: urlPublica,
                },
            ]);

            if (error) throw error;

            setNuevoProducto({
                nombre_producto: "",
                descripcion_producto: "",
                categoria_producto: "",
                precio_venta: "",
                archivo: null,
            });

            setToast({
                mostrar: true,
                mensaje: "Producto registrado correctamente",
                tipo: "exito",
            });

            cargarProductos(); // 🔥 refresca tabla

        } catch (err) {
            console.error(err);
            setToast({
                mostrar: true,
                mensaje: "Error al registrar producto",
                tipo: "error",
            });
        }
    };

   return (
        <Container className="mt-3">

            {/* HEADER MODERNO */}
            <div className="encabezado-pagina d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h3 className="mb-0">
                        <i className="bi-bag-heart-fill me-2"></i> Productos
                    </h3>
                    <div className="subtitulo-pagina">
                        Administra el inventario de tu tienda
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="light"
                        className="btn-encabezado-pagina"
                        onClick={generarPDFProductos}
                    >
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        <span className="d-none d-sm-inline">Descargar PDF</span>
                    </Button>

                    <Button
                        className="btn-encabezado-pagina"
                        onClick={() => setMostrarModal(true)}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        <span className="d-none d-sm-inline">Nuevo Producto</span>
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
                                placeholder="Buscar por nombre, descripción o precio..."
                            />
                        </div>
                    </Col>
                </Row>

                {/* TABLA → SOLO EN PC */}
                <div className="d-none d-md-block">
                    <TablaProductos
                        productos={productosFiltrados}
                        categorias={categorias}
                        onEditar={(prod) => {
                            setProductoEditar(prod);
                            setMostrarModalEdicion(true);
                        }}
                        onEliminar={(prod) => {
                            setProductoAEliminar(prod);
                            setMostrarModalEliminacion(true);
                        }}
                    />
                </div>

                {/* TARJETAS → SOLO EN MÓVIL */}
                <div className="d-block d-md-none">
                    <TarjetaProductos
                        productos={productosFiltrados}
                        categorias={categorias}
                        abrirModalEdicion={(prod) => {
                            setProductoEditar(prod);
                            setMostrarModalEdicion(true);
                        }}
                        abrirModalEliminacion={(prod) => {
                            setProductoAEliminar(prod);
                            setMostrarModalEliminacion(true);
                        }}
                    />
                </div>

            </div>

            {/* MODAL */}
            <ModalRegistroProducto
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevoProducto={nuevoProducto}
                manejoCambioInput={manejoCambioInput}
                manejoCambioArchivo={manejoCambioArchivo}
                agregarProducto={agregarProducto}
                categorias={categorias}
            />

            <ModalEdicionProducto
                mostrarModal={mostrarModalEdicion}
                setMostrarModal={setMostrarModalEdicion}
                productoEditar={productoEditar}
                setProductoEditar={setProductoEditar}
                categorias={categorias}
                setToast={setToast}
                recargarProductos={cargarProductos}
            />

            <ModalEliminacionProducto
                mostrarModal={mostrarModalEliminacion}
                setMostrarModal={setMostrarModalEliminacion}
                productoAEliminar={productoAEliminar}
                setProductoAEliminar={setProductoAEliminar}
                setToast={setToast}
                recargarProductos={cargarProductos}
            />

            {/* NOTIFICACIÓN */}
            <NotificacionOperacion
                mostrar={toast.mostrar}
                mensaje={toast.mensaje}
                tipo={toast.tipo}
                onCerrar={() => setToast({ ...toast, mostrar: false })}
            />

        </Container>
    );
};

export default Productos;