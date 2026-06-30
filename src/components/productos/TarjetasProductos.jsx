import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Spinner, Button, Image } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TarjetaProductos = ({
  productos = [], // 👈 evita errores si viene undefined
  abrirModalEdicion,
  abrirModalEliminacion
}) => {

  const [cargando, setCargando] = useState(true);
  const [idTarjetaActiva, setIdTarjetaActiva] = useState(null);

  // 🔹 Detectar carga correctamente
  useEffect(() => {
    setCargando(productos.length === 0);
  }, [productos]);

  // 🔹 Cerrar con ESC
  const manejarTeclaEscape = useCallback((evento) => {
    if (evento.key === "Escape") {
      setIdTarjetaActiva(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", manejarTeclaEscape);
    return () => {
      window.removeEventListener("keydown", manejarTeclaEscape);
    };
  }, [manejarTeclaEscape]);

  // 🔹 Activar tarjeta
  const alternarTarjetaActiva = (id) => {
    setIdTarjetaActiva((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {cargando ? (
        <div className="text-center my-5">
          <h5>No hay productos disponibles</h5>
        </div>
      ) : (
        <div>
          {productos.map((producto) => {
            const activa = idTarjetaActiva === producto.id_producto;

            return (
              <Card
                key={producto.id_producto}
                className="mb-3 border-0 rounded-3 shadow-sm w-100"
                onClick={() => alternarTarjetaActiva(producto.id_producto)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    alternarTarjetaActiva(producto.id_producto);
                  }
                }}
              >
                <Card.Body className={`p-2 ${activa ? "bg-light" : ""}`}>
                  <Row className="align-items-center gx-3">

                    {/* Imagen */}
                    <Col xs={3}>
                      {producto.url_imagen ? (
                        <Image
                          src={producto.url_imagen}
                          width={60}
                          height={60}
                          rounded
                        />
                      ) : (
                        <div
                          className="bg-light d-flex justify-content-center align-items-center rounded"
                          style={{ height: 60 }}
                        >
                          <i className="bi bi-image text-muted"></i>
                        </div>
                      )}
                    </Col>

                    {/* Info */}
                    <Col xs={5}>
                      <div className="fw-semibold text-truncate">
                        {producto.nombre_producto}
                      </div>
                      <div className="small text-muted text-truncate">
                        {producto.descripcion_producto || "Sin descripción"}
                      </div>
                    </Col>

                    {/* Precio */}
                    <Col xs={4} className="text-end">
                      <div className="fw-bold">
                        C$ {parseFloat(producto.precio_venta || 0).toFixed(2)}
                      </div>
                    </Col>

                  </Row>
                </Card.Body>

                {/* Acciones */}
                {activa && (
                  <div
                    className="p-2 d-flex justify-content-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline-warning"
                      size="sm"
                      onClick={() => {
                        abrirModalEdicion(producto);
                        setIdTarjetaActiva(null);
                      }}
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>

                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        abrirModalEliminacion(producto);
                        setIdTarjetaActiva(null);
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default TarjetaProductos;