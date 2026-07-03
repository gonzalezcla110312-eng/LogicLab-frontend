# LogicLab

LogicLab es una aplicación web para la gestión de un restaurante con un enfoque multirol: cliente, mesero, cocinero y administrador. El frontend está construido con React y Vite, y se comunica con una API backend para manejar autenticación, pedidos, menú del día y administración.

## Tecnologías utilizadas

| Área | Tecnología | Propósito |
| --- | --- | --- |
| Frontend | React 19 | Construcción de la interfaz de usuario |
| Bundler | Vite 8 | Desarrollo rápido y compilación optimizada |
| HTTP client | Axios | Consumo de la API |
| Estilos | CSS personalizado + Bootstrap Icons | Diseño visual y componentes de interfaz |
| Calidad de código | ESLint | Revisiones y buenas prácticas |
| Variables de entorno | Vite env (`import.meta.env`) | Configuración de URLs y rutas dinámicas |

## Requisitos para correr el proyecto

- Node.js 18 o superior (recomendado 20+)
- npm o pnpm
- Un backend funcionando con la API REST a la que apunta la configuración del frontend
- Archivo `.env` configurado correctamente

## Variables de entorno

Copia el ejemplo disponible en [.env.example](.env.example) y ajusta los valores según tu entorno:

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API backend |
| `VITE_MENU_DIA_BASE_PATH` | Ruta base para consultar el menú del día |
| `VITE_MESAS_PUBLIC_PATH` | Ruta pública para consultar mesas disponibles |

## Comandos para usar

```bash
npm install
copy .env.example .env
npm run dev
```

> Si usas PowerShell, también puedes ejecutar `Copy-Item .env.example .env`.

Otros comandos útiles:

```bash
npm run build
npm run preview
npm run lint
```

## Estructura principal del frontend

La aplicación está organizada en los siguientes módulos:

- `src/components/Login.jsx` → acceso para personal y cliente
- `src/components/VistaCliente.jsx` → vista pública del menú para el cliente
- `src/components/Panel_Mesero.jsx` → panel para tomar y gestionar pedidos
- `src/components/Panel_Cocinero.jsx` → vista para cocina y seguimiento de órdenes
- `src/components/Admin/*` → administración de empleados, platos y menús
- `src/services/api.js` → configuración central de Axios y manejo de autenticación
- `src/services/menuDia.js` → servicios relacionados con el menú del día
- `src/styles/*` → estilos visuales por vista

## Qué debe llevar el frontend

El frontend de LogicLab debería incluir:

- Inicio de sesión diferenciando roles (mesero, cocinero, administrador)
- Vista del cliente para explorar el menú digital
- Panel para meseros para tomar pedidos y ver estado de mesas
- Panel para cocina para actualizar órdenes y estados
- Panel administrativo para manejar empleados, platos y menús del día
- Manejo de sesión mediante `localStorage` (token, usuario y página actual)
- Consumo de API con manejo de errores y validaciones básicas
- Diseño responsive para dispositivos móviles y pantallas de restaurante
- Integración con imágenes de platos y rutas públicas configurables por variables de entorno

## Flujo recomendado

1. Instala dependencias con `npm install`
2. Define tu configuración en `.env`
3. Inicia la aplicación con `npm run dev`
4. Verifica el flujo de login, menú del cliente y paneles por rol
5. Ejecuta `npm run build` antes de desplegar

