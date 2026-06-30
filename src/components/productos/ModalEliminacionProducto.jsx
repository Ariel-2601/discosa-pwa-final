import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { supabase } from "../../database/supabaseconfig";

const ModalEliminacionProducto = ({
  mostrarModal,
  setMostrarModal,
  productoAEliminar,
  setProductoAEliminar,
  setToast,
  recargarProductos
}) => {

  const [eliminando, setEliminando] = useState(false);

  const eliminarProducto = async () => {
    try {
      if (!productoAEliminar) return;

      setEliminando(true);

      // 🔹 Eliminar de la BD
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_producto", productoAEliminar.id_producto);

      if (error) throw error;

      // 🔹 (Opcional) eliminar imagen del storage
      if (productoAEliminar.url_imagen) {
        const nombreArchivo = productoAEliminar.url_imagen.split("/").pop();

        await supabase.storage
          .from("imagenes_productos")
          .remove([nombreArchivo]);
      }

      setToast({
        mostrar: true,
        mensaje: "Producto eliminado correctamente",
        tipo: "exito",
      });

      setMostrarModal(false);
      setProductoAEliminar(null);
      recargarProductos();

    } catch (err) {
      console.error("Error al eliminar:", err);

      setToast({
        mostrar: true,
        mensaje: "Error al eliminar producto",
        tipo: "error",
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Modal
      show={mostrarModal}
      onHide={() => setMostrarModal(false)}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Eliminar Producto</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          ¿Estás seguro que deseas eliminar el producto{" "}
          <strong>
            {productoAEliminar?.nombre_producto || ""}
          </strong>?
        </p>
        <p className="text-danger mb-0">
          Esta acción no se puede deshacer.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => setMostrarModal(false)}
        >
          Cancelar
        </Button>

        <Button
          variant="danger"
          onClick={eliminarProducto}
          disabled={eliminando}
        >
          {eliminando ? "Eliminando..." : "Eliminar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalEliminacionProducto;