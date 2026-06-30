import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";

import ModalRegistroEmpleado from "../components/empleado/ModalRegistroEmpleado";
import ModalEdicionEmpleado from "../components/empleado/ModalEdicionEmpleado";
import TablaEmpleados from "../components/empleado/TablaEmpleados";
import TarjetaEmpleado from "../components/empleado/TarjetaEmpleado";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Empleados = () => {
    const [empleados, setEmpleados] = useState([]);
    const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
    const [textoBusqueda, setTextoBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);   // ← Estado de carga inicial
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

    const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

    const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
    const [paginaActual, establecerPaginaActual] = useState(1);

    const [nuevoEmpleado, setNuevoEmpleado] = useState({
        nombre_empleado: "",
        apellido_empleado: "",
        celular: "",
        pin: "",
        email: "",
        password: "",
        tipo_empleado: "",
    });

    const [empleadoEditar, setEmpleadoEditar] = useState({
        id_empleado: "",
        nombre_empleado: "",
        apellido_empleado: "",
        celular: "",
        pin: "",
        email: "",
        tipo_empleado: "",
    });

    // Cargar empleados
    const cargarEmpleados = async () => {
        try {
            setCargando(true);
            const { data, error } = await supabase
                .from("empleados")
                .select("*")
                .order("id_empleado", { ascending: true });

            if (error) {
                setToast({ mostrar: true, mensaje: "Error al cargar empleados", tipo: "error" });
                return;
            }
            setEmpleados(data || []);
            setEmpleadosFiltrados(data || []);
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error inesperado al cargar empleados", tipo: "error" });
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarEmpleados();
    }, []);

    // Filtrado
    useEffect(() => {
        if (!textoBusqueda.trim()) {
            setEmpleadosFiltrados(empleados);
        } else {
            const texto = textoBusqueda.toLowerCase().trim();
            const filtrados = empleados.filter(emp =>
                `${emp.nombre_empleado} ${emp.apellido_empleado} ${emp.email || ""} ${emp.tipo_empleado || ""}`
                    .toLowerCase().includes(texto)
            );
            setEmpleadosFiltrados(filtrados);
        }
        establecerPaginaActual(1);
    }, [textoBusqueda, empleados]);

    const empleadosPaginados = empleadosFiltrados.slice(
        (paginaActual - 1) * registrosPorPagina,
        paginaActual * registrosPorPagina
    );

    const agregarEmpleado = async () => {
        if (!nuevoEmpleado.nombre_empleado || !nuevoEmpleado.apellido_empleado ||
            !nuevoEmpleado.email || !nuevoEmpleado.password || !nuevoEmpleado.tipo_empleado) {
            setToast({ mostrar: true, mensaje: "Los campos Nombre, Apellido, Email, Contraseña y Rol son obligatorios", tipo: "advertencia" });
            return;
        }

        try {
            setMostrarModal(false);

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: nuevoEmpleado.email,
                password: nuevoEmpleado.password,
                options: {
                    data: {
                        nombre: nuevoEmpleado.nombre_empleado,
                        apellido: nuevoEmpleado.apellido_empleado,
                    }
                }
            });

            if (authError) throw authError;

            const { error: dbError } = await supabase.from("empleados").insert([{
                nombre_empleado: nuevoEmpleado.nombre_empleado,
                apellido_empleado: nuevoEmpleado.apellido_empleado,
                celular: nuevoEmpleado.celular,
                pin: nuevoEmpleado.pin,
                email: nuevoEmpleado.email,
                tipo_empleado: nuevoEmpleado.tipo_empleado,
            }]);

            if (dbError) throw dbError;

            await cargarEmpleados();
            setNuevoEmpleado({ nombre_empleado: "", apellido_empleado: "", celular: "", pin: "", email: "", password: "", tipo_empleado: "" });

            setToast({
                mostrar: true,
                mensaje: `Empleado ${nuevoEmpleado.nombre_empleado} registrado correctamente`,
                tipo: "exito"
            });
        } catch (err) {
            console.error(err);
            setToast({ mostrar: true, mensaje: err.message || "Error al registrar empleado", tipo: "error" });
        }
    };

    const actualizarEmpleado = async () => {
        if (!empleadoEditar.nombre_empleado || !empleadoEditar.apellido_empleado ||
            !empleadoEditar.tipo_empleado) {
            setToast({ mostrar: true, mensaje: "Nombre, Apellido y Rol son obligatorios", tipo: "advertencia" });
            return;
        }

        try {
            setMostrarModalEdicion(false);
            const { error } = await supabase
                .from("empleados")
                .update({
                    nombre_empleado: empleadoEditar.nombre_empleado,
                    apellido_empleado: empleadoEditar.apellido_empleado,
                    celular: empleadoEditar.celular,
                    pin: empleadoEditar.pin,
                    tipo_empleado: empleadoEditar.tipo_empleado,
                })
                .eq("id_empleado", empleadoEditar.id_empleado);

            if (error) throw error;

            await cargarEmpleados();
            setToast({
                mostrar: true,
                mensaje: `Empleado ${empleadoEditar.nombre_empleado} actualizado`,
                tipo: "exito"
            });
        } catch (err) {
            setToast({ mostrar: true, mensaje: "Error al actualizar empleado", tipo: "error" });
        }
    };

    const abrirModalEdicion = (empleado) => {
        setEmpleadoEditar({
            id_empleado: empleado.id_empleado,
            nombre_empleado: empleado.nombre_empleado,
            apellido_empleado: empleado.apellido_empleado,
            celular: empleado.celular || "",
            pin: empleado.pin || "",
            email: empleado.email || "",
            tipo_empleado: empleado.tipo_empleado,
        });
        setMostrarModalEdicion(true);
    };

    // 📄 PDF GENERAL DE EMPLEADOS
    const generarPDFEmpleados = () => {

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Reporte General de Empleados", 14, 20);

        doc.line(14, 25, 195, 25);

        autoTable(doc, {
            startY: 32,
            head: [["ID", "Nombre", "Apellido", "Celular", "Email", "Rol"]],
            body: empleadosFiltrados.map((emp) => [
                emp.id_empleado,
                emp.nombre_empleado,
                emp.apellido_empleado,
                emp.celular || "",
                emp.email || "",
                emp.tipo_empleado || "",
            ]),
            headStyles: { fillColor: [40, 137, 182] },
            styles: { fontSize: 9, cellPadding: 3 },
        });

        doc.save("reporte_empleados.pdf");
    };

   return (
        <Container className="mt-3">

            {/* HEADER MODERNO */}
            <div className="encabezado-pagina d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <h3 className="mb-0">
                        <i className="bi-person-badge-fill me-2"></i>Empleados
                    </h3>
                    <div className="subtitulo-pagina">
                        Gestiona el personal del sistema
                    </div>
                </div>

                <div className="d-flex gap-2">
                    <Button
                        variant="light"
                        className="btn-encabezado-pagina"
                        onClick={generarPDFEmpleados}
                    >
                        <i className="bi bi-file-earmark-pdf me-2"></i>
                        <span className="d-none d-sm-inline">Descargar PDF</span>
                    </Button>

                    <Button className="btn-encabezado-pagina" onClick={() => setMostrarModal(true)}>
                        <i className="bi-plus-lg me-2"></i>Nuevo Empleado
                    </Button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="tarjeta-contenido">

                {/* BUSCADOR */}
                <Row className="mb-4">
                    <Col md={6}>
                        <div className="buscador-moderno">
                            <CuadroBusquedas
                                textoBusqueda={textoBusqueda}
                                manejarCambioBusqueda={(e) => setTextoBusqueda(e.target.value)}
                            />
                        </div>
                    </Col>
                </Row>

                {/* Alert cuando no hay coincidencias en la búsqueda */}
                {!cargando && textoBusqueda.trim() && empleadosFiltrados.length === 0 && (
                    <Alert variant="info" className="text-center">
                        <i className="bi bi-info-circle me-2"></i>
                        No se encontraron empleados que coincidan con "{textoBusqueda}".
                    </Alert>
                )}

                {/* Tabla / tarjetas */}
                {(cargando || empleadosFiltrados.length > 0) && (
                    <Row>
                        <Col xs={12} className="d-lg-none">
                            <TarjetaEmpleado
                                empleados={empleadosFiltrados}
                                cargando={cargando}
                                abrirModalEdicion={abrirModalEdicion}
                            />
                        </Col>
                        <Col lg={12} className="d-none d-lg-block">
                            <TablaEmpleados
                                empleados={empleadosFiltrados}
                                cargando={cargando}
                                abrirModalEdicion={abrirModalEdicion}
                            />
                        </Col>
                    </Row>
                )}

            </div>

            {/* Modales */}
            <ModalRegistroEmpleado
                mostrarModal={mostrarModal}
                setMostrarModal={setMostrarModal}
                nuevoEmpleado={nuevoEmpleado}
                setNuevoEmpleado={setNuevoEmpleado}
                agregarEmpleado={agregarEmpleado}
            />

            <ModalEdicionEmpleado
                mostrarModalEdicion={mostrarModalEdicion}
                setMostrarModalEdicion={setMostrarModalEdicion}
                empleadoEditar={empleadoEditar}
                setEmpleadoEditar={setEmpleadoEditar}
                actualizarEmpleado={actualizarEmpleado}
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

export default Empleados;