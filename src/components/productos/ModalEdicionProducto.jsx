import React, { useState } from "react";
import { Modal, Form, Button, Row, Col } from "react-bootstrap";
import { supabase } from "../../database/supabaseconfig";

const ModalEdicionProducto = ({
  mostrarModal,
  setMostrarModal,
  productoEditar,
  setProductoEditar,
  categorias,
  setToast,
  recargarProductos
}) => {

  const [guardando, setGuardando] = useState(false);

  // 🔹 Inputs
  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setProductoEditar((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 🔹 Imagen
  const manejoCambioArchivo = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) return;

    if (archivo.type.startsWith("image/")) {
      setProductoEditar((prev) => ({
        ...prev,
        archivo // 🔥 IMPORTANTE: guardar archivo
      }));
    } else {
      alert("Selecciona una imagen válida");
    }
  };

  // 🔹 Actualizar producto
  const actualizarProducto = async () => {
    try {
      if (!productoEditar.nombre_producto?.trim()) {
        setToast({
          mostrar: true,
          mensaje: "El nombre es obligatorio",
          tipo: "advertencia",
        });
        return;
      }

      setGuardando(true);

      let urlImagen = productoEditar.url_imagen;

      // 🔥 Subir nueva imagen si existe
      if (productoEditar.archivo) {
        const nombreArchivo = `${Date.now()}-${productoEditar.archivo.name}`;

        const { error: uploadError } = await supabase.storage
          .from("imagenes_productos")
          .upload(nombreArchivo, productoEditar.archivo);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("imagenes_productos")
          .getPublicUrl(nombreArchivo);

        urlImagen = data.publicUrl;
      }

      // 🔹 Update BD
      const { error } = await supabase
        .from("productos")
        .update({
          nombre_producto: productoEditar.nombre_producto,
          descripcion_producto: productoEditar.descripcion_producto,
          categoria_producto: productoEditar.categoria_producto,
          precio_venta: parseFloat(productoEditar.precio_venta),
          url_imagen: urlImagen
        })
        .eq("id_producto", productoEditar.id_producto);

      if (error) throw error;

      setToast({
        mostrar: true,
        mensaje: "Producto actualizado correctamente",
        tipo: "exito",
      });

      setMostrarModal(false);
      recargarProductos();

    } catch (err) {
      console.error(err);

      setToast({
        mostrar: true,
        mensaje: "Error al actualizar producto",
        tipo: "error",
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      backdrop="static"
      centered
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>Editar Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Row>

            {/* Categoría */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Categoría *</Form.Label>
                <Form.Select
                  name="categoria_producto"
                  value={productoEditar?.categoria_producto || ""}
                  onChange={manejoCambioInput}
                >
                  <option value="">Seleccione...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Nombre */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre_producto"
                  value={productoEditar?.nombre_producto || ""}
                  onChange={manejoCambioInput}
                />
              </Form.Group>
            </Col>

            {/* Precio */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Precio</Form.Label>
                <Form.Control
                  type="number"
                  name="precio_venta"
                  value={productoEditar?.precio_venta || ""}
                  onChange={manejoCambioInput}
                />
              </Form.Group>
            </Col>

            {/* Imagen */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Imagen</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={manejoCambioArchivo}
                />
              </Form.Group>
            </Col>

            {/* 🔥 PREVISUALIZACIÓN */}
            <Col md={12}>
              {(productoEditar?.archivo || productoEditar?.url_imagen) && (
                <div className="text-center mt-3">
                  <img
                    src={
                      productoEditar.archivo
                        ? URL.createObjectURL(productoEditar.archivo)
                        : productoEditar.url_imagen
                    }
                    alt="Vista previa"
                    style={{
                      maxWidth: "100px",
                      borderRadius: "100px",
                      objectFit: "cover"
                    }}
                  />
                </div>
              )}
            </Col>

            {/* Descripción */}
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion_producto"
                  value={productoEditar?.descripcion_producto || ""}
                  onChange={manejoCambioInput}
                />
              </Form.Group>
            </Col>

          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={() => setMostrarModal(false)}>
          Cancelar
        </Button>

        <Button
          variant="primary"
          onClick={actualizarProducto}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Actualizar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEdicionProducto;