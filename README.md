# Ariel - Sistema de Gestión (PWA)

Aplicación web tipo PWA para la gestión de una tienda: productos, categorías, clientes, empleados y ventas, con autenticación, catálogo público, búsqueda, paginación, reportes en PDF y un panel de estadísticas con gráficos.

## Tecnologías

- **React 19 + Vite** — interfaz de usuario
- **React Router DOM** — navegación entre vistas
- **React Bootstrap / Bootstrap Icons** — componentes UI
- **Supabase** — base de datos, autenticación y almacenamiento de imágenes
- **Recharts** — gráficos estadísticos del panel de Inicio
- **jsPDF / jsPDF-AutoTable** — generación de reportes en PDF
- **Jest** — pruebas unitarias

## Estructura del proyecto

```
src/
├── components/      # Componentes reutilizables, organizados por módulo
│   ├── busquedas/
│   ├── categorias/
│   ├── clientes/
│   ├── empleado/
│   ├── productos/
│   ├── ventas/
│   ├── navegacion/
│   ├── ordenamiento/
│   └── rutas/        # Protección de rutas privadas
├── database/        # Configuración del cliente de Supabase
├── views/           # Vistas/páginas de la aplicación
└── test/            # Pruebas unitarias con Jest
```

## Configuración

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env` en la raíz con tus credenciales de Supabase (no se sube al repositorio):
   ```
   VITE_SUPABASE_API_KEY=tu-api-key
   VITE_SUPABASE_URL=tu-url-de-supabase
   ```
3. Ejecuta el proyecto en modo desarrollo:
   ```bash
   npm run dev
   ```

## Scripts disponibles

- `npm run dev` — entorno de desarrollo
- `npm run build` — build de producción
- `npm run preview` — previsualizar el build
- `npm run lint` — analizar el código con ESLint
- `npm test` — ejecutar pruebas con cobertura (Jest)

## Funcionalidades principales

- **Autenticación**: inicio y cierre de sesión con Supabase Auth; rutas privadas protegidas.
- **CRUD completo** de productos, categorías, clientes, empleados y ventas.
- **Catálogo público** con filtro por categoría y búsqueda por texto.
- **Carga de imágenes** de productos mediante Supabase Storage.
- **Búsqueda y paginación** en todos los listados.
- **Panel de Inicio** con KPIs y gráficos (ventas por mes, productos más vendidos, métodos de pago).
- **Reportes en PDF** de productos.

## Despliegue

El proyecto está preparado para desplegarse en Netlify (archivo `public/_redirects` incluido para el manejo de rutas de React Router).

## Autor

