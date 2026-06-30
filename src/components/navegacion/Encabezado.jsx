import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar, Nav, Container } from "react-bootstrap";
import { supabase } from "../../database/supabaseconfig";
import logo from "../../assets/logo.png";

const Encabezado = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const esLogin =
    location.pathname === "/login";

  const paginas = [
    {
      ruta: "/",
      texto: "Inicio"
    },
    {
      ruta: "/categorias",
      texto: "Categorías"
    },
    {
      ruta: "/productos",
      texto: "Productos"
    },
    {
      ruta: "/empleados",
      texto: "Empleados"
    },
    {
      ruta: "/clientes",
      texto: "Clientes"
    },
    {
      ruta: "/ventas",
      texto: "Ventas"
    },
    {
      ruta: "/catalogo",
      texto: "Catálogo"
    }
  ];

  const ir = (ruta) => {

    navigate(ruta);

  };

  const cerrarSesion = async () => {

    await supabase.auth.signOut();

    localStorage.removeItem(
      "usuario-supabase"
    );

    navigate("/login");

  };

  return (

    <Navbar
      expand="lg"
      fixed="top"
      variant="dark"
      className="
      color-navbar
      shadow-sm
      py-2
      "
    >

      <Container>

        {/* Logo */}

        <Navbar.Brand
          onClick={() => ir("/")}
          className="
          d-flex
          align-items-center
          gap-2
          "
          style={{
            cursor: "pointer"
          }}
        >

          <img
            src={logo}
            alt="Logo"
            width="40"
            height="40"
          />

          <span
            className="
            fw-bold
            "
          >

            Discosa

          </span>

        </Navbar.Brand>

        {!esLogin && (

          <>

            <Navbar.Toggle />

            <Navbar.Collapse>

              {/* Centro */}

              <Nav
                className="
                mx-auto
                gap-3
                "
              >

                {paginas.map(
                  (pagina) => (

                  <Nav.Link
                    key={
                      pagina.ruta
                    }
                    onClick={() =>
                      ir(
                        pagina.ruta
                      )
                    }
                  >

                    {pagina.texto}

                  </Nav.Link>

                ))}

              </Nav>

              {/* Derecha */}

              <Nav
                className="
                ms-auto
                "
              >

                <Nav.Link
                  onClick={
                    cerrarSesion
                  }
                >

                  Cerrar sesión

                </Nav.Link>

              </Nav>

            </Navbar.Collapse>

          </>

        )}

      </Container>

    </Navbar>

  );

};

export default Encabezado;