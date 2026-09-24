# LogicLab - Frontend

LogicLab es una aplicación web para la gestión integral de un restaurante, desarrollada con React y Vite.

El sistema utiliza diferentes roles de usuario y permite gestionar clientes, meseros, cocina, administración, mesas, pedidos, menú, ganancias, PQRS y reservaciones.

---

## Tecnologías utilizadas

| Área | Tecnología | Propósito |
|---|---|---|
| Frontend | React 19 | Construcción de la interfaz de usuario |
| Bundler | Vite 8 | Desarrollo y compilación |
| HTTP Client | Axios | Comunicación con la API backend |
| Estilos | CSS + Bootstrap Icons | Diseño de la interfaz |
| Calidad de código | ESLint | Revisión y buenas prácticas |
| Backend | Node.js + Express | API REST |
| Base de datos | MySQL | Persistencia de información |
| Aplicación móvil | Flutter | Aplicación móvil |
| Integración móvil | WebView | Ejecución del frontend web desde Flutter |

---

## Arquitectura general

```text
┌──────────────────────────────┐
│       Aplicación Flutter     │
│          Android             │
└──────────────┬───────────────┘
               │
               │ WebView
               ▼
┌──────────────────────────────┐
│       React + Vite           │
│        Frontend Web           │
│                              │
│ http://192.168.80.25:5173   │
└──────────────┬───────────────┘
               │
               │ Axios / HTTP
               ▼
┌──────────────────────────────┐
│       Node.js + Express      │
│          Backend API         │
│                              │
│ http://192.168.80.25:3001   │
└──────────────┬───────────────┘
               │
               │ SQL
               ▼
┌──────────────────────────────┐
│            MySQL             │
│           LogicLab           │
└──────────────────────────────┘
```

---

# Roles del sistema

LogicLab trabaja con diferentes tipos de usuarios.

## Cliente

El cliente puede:

- Iniciar sesión.
- Consultar el menú.
- Consultar platos.
- Realizar pedidos.
- Consultar información de sus pedidos.
- Gestionar información relacionada con su cuenta.
- Enviar solicitudes PQRS.

## Mesero

El mesero puede:

- Gestionar pedidos.
- Consultar mesas.
- Gestionar el estado de las mesas.
- Registrar pedidos.
- Consultar información de clientes.
- Trabajar con las operaciones relacionadas con el servicio del restaurante.

## Cocinero

El cocinero puede:

- Consultar pedidos.
- Consultar los platos solicitados.
- Actualizar estados relacionados con la preparación.
- Gestionar el flujo de pedidos de cocina.

## Administrador

El administrador cuenta con acceso a los módulos administrativos, incluyendo:

- Gestión de empleados.
- Gestión de usuarios.
- Gestión de mesas.
- Gestión de pedidos.
- Gestión de platos.
- Gestión del menú.
- Gestión de reservaciones.
- Consulta de ganancias.
- Gestión de PQRS.
- Consulta de información general del restaurante.

---

# Autenticación y usuarios

El frontend se comunica con el backend para realizar procesos de autenticación y gestión de usuarios.

La comunicación se realiza mediante solicitudes HTTP utilizando Axios.

Ejemplo de configuración:

```env
VITE_API_URL=http://localhost:3001/api
```

Para acceder al backend desde otro dispositivo conectado a la misma red local:

```env
VITE_API_URL=http://192.168.80.25:3001/api
```

La aplicación utiliza autenticación mediante token para proteger las rutas que requieren usuario autenticado.

---

# Gestión de clientes

El sistema permite gestionar la información relacionada con los clientes.

Entre las funcionalidades se encuentran:

- Registro.
- Inicio de sesión.
- Consulta de información.
- Actualización de datos.
- Gestión de pedidos.
- Consulta de información relacionada con el usuario.

---

# Gestión de empleados

El administrador cuenta con un módulo para la gestión de empleados.

Archivo principal:

```text
src/components/Admin/Empleados.jsx
```

Este módulo permite trabajar con la información de los empleados y usuarios relacionados con el restaurante.

---

# Gestión de mesas

LogicLab permite administrar las mesas del restaurante.

Las mesas se relacionan con:

- Pedidos.
- Reservaciones.
- Estados de disponibilidad.
- Operaciones del mesero.

La información de las mesas se obtiene desde el backend mediante la API.

---

# Gestión de pedidos

El sistema permite administrar pedidos desde diferentes roles.

Los pedidos pueden involucrar:

- Cliente.
- Mesero.
- Cocina.
- Mesa.
- Platos.
- Estado del pedido.

El flujo general es:

```text
Cliente
   │
   ▼
Pedido
   │
   ▼
Mesero
   │
   ▼
Cocina
   │
   ▼
Preparación
   │
   ▼
Entrega
```

---

# Gestión de platos y menú

El sistema incluye funcionalidades para administrar los platos disponibles en el restaurante.

El administrador puede gestionar información relacionada con:

- Nombre del plato.
- Descripción.
- Precio.
- Categoría.
- Disponibilidad.
- Imagen.
- Información asociada al menú.

---

# Gestión de reservaciones

LogicLab incluye un módulo administrativo para gestionar las reservaciones del restaurante.

Archivo principal:

```text
src/components/Admin/Reservaciones.jsx
```

El módulo permite:

- Crear reservaciones.
- Consultar reservaciones.
- Editar reservaciones.
- Confirmar reservaciones.
- Marcar reservaciones como atendidas.
- Cancelar reservaciones.
- Consultar las mesas disponibles.
- Registrar información del cliente.
- Registrar número de personas.
- Registrar fecha y hora.
- Registrar observaciones.

Los datos principales de una reservación son:

| Campo | Descripción |
|---|---|
| Nombre | Nombre del cliente |
| Teléfono | Teléfono del cliente |
| Email | Correo electrónico |
| Mesa | Mesa asignada |
| Fecha | Fecha de la reservación |
| Hora | Hora de la reservación |
| Personas | Número de personas |
| Observaciones | Información adicional |
| Estado | Estado actual de la reservación |

Estados utilizados:

```text
pendiente
confirmada
atendida
cancelada
```

---

# API de reservaciones

El frontend utiliza los siguientes endpoints:

```text
GET    /api/reservaciones
GET    /api/mesas
POST   /api/reservaciones
PUT    /api/reservaciones/:id
PATCH  /api/reservaciones/:id/estado
```

La API de reservaciones está implementada en el backend mediante:

```text
controllers/reservaciones.controller.js
routes/reservaciones.routes.js
services/reservaciones.service.js
```

---

# Panel administrativo

El panel principal del administrador se encuentra en:

```text
src/components/Admin/Panel_Administrador.jsx
```

Desde este panel se pueden seleccionar las diferentes secciones administrativas.

Entre ellas:

```text
Empleados
Mesas
Pedidos
Platos
Ganancias
PQRS
Reservaciones
```

El módulo de reservaciones se integra mediante:

```jsx
import Reservaciones from './Reservaciones'
```

y se muestra cuando la sección seleccionada corresponde a:

```jsx
{seccion === "reservaciones" && (
  <Reservaciones />
)}
```

---

# Ganancias

El sistema incluye un módulo administrativo para consultar información relacionada con las ganancias generadas por el restaurante.

La información se obtiene a partir de los datos almacenados en el sistema.

---

# PQRS

LogicLab incluye funcionalidades para la gestión de:

- Peticiones.
- Quejas.
- Reclamos.
- Sugerencias.

Los usuarios pueden registrar solicitudes y el personal autorizado puede consultarlas y gestionarlas.

---

# Configuración de la API

El frontend utiliza una variable de entorno para definir la dirección del backend.

Archivo:

```text
.env
```

Configuración para desarrollo local en el mismo computador:

```env
VITE_API_URL=http://localhost:3001/api
```

Configuración para utilizar la aplicación desde otro dispositivo conectado a la misma red:

```env
VITE_API_URL=http://192.168.80.25:3001/api
```

> La dirección IP `192.168.80.25` corresponde a la configuración de red utilizada actualmente durante el desarrollo local. Puede cambiar dependiendo de la red utilizada.

---

# Requisitos

Para ejecutar el proyecto se necesita tener instalado:

- Node.js
- npm
- Git
- MySQL
- Visual Studio Code

Para la aplicación móvil también se necesita:

- Flutter
- Android SDK
- Un dispositivo Android o emulador

---

# Instalación

Clonar el repositorio:

```powershell
git clone https://github.com/gonzalezcla110312-eng/LogicLab-frontend.git
```

Ingresar al proyecto:

```powershell
cd LogicLab-frontend
```

Instalar las dependencias:

```powershell
npm install
```

---

# Ejecución del frontend

Para iniciar el servidor de desarrollo:

```powershell
npm run dev
```

Para permitir el acceso desde otros dispositivos de la red local:

```powershell
npm run dev -- --host 0.0.0.0
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173/
```

Desde otro dispositivo conectado a la misma red:

```text
http://192.168.80.25:5173/
```

---

# Backend

El frontend depende del backend de LogicLab para realizar las operaciones de autenticación, usuarios, mesas, pedidos, platos, reservaciones y demás funcionalidades.

Repositorio del backend:

https://github.com/gonzalezcla110312-eng/LogicLab-backend

El backend se ejecuta actualmente en:

```text
http://localhost:3001
```

Desde otro dispositivo de la red local:

```text
http://192.168.80.25:3001
```

---

# Estructura principal del proyecto

```text
LogicLab-frontend/
│
├── public/
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   │
│   │   ├── Admin/
│   │   │   ├── Empleados.jsx
│   │   │   ├── Panel_Administrador.jsx
│   │   │   └── Reservaciones.jsx
│   │   │
│   │   ├── Cliente/
│   │   │
│   │   ├── Cocinero/
│   │   │
│   │   ├── Mesero/
│   │   │
│   │   └── ...
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
│
├── .env
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
└── vite.config.js
```

---

# Aplicación móvil

LogicLab también cuenta con una aplicación móvil desarrollada con Flutter.

Repositorio:

https://github.com/gonzalezcla110312-eng/LogicLab-Movil-Flutter

La aplicación móvil utiliza un WebView para cargar el frontend React.

Arquitectura:

```text
Flutter
   │
   ▼
WebView
   │
   ▼
React + Vite
   │
   ▼
Node.js + Express
   │
   ▼
MySQL
```

La aplicación móvil utiliza actualmente:

```text
http://192.168.80.25:5173/
```

para cargar el frontend desde el computador durante el desarrollo.

El backend utiliza:

```text
http://192.168.80.25:3001/
```

---

# Ejecución de la aplicación móvil

Ingresar al proyecto Flutter:

```powershell
cd "C:\Users\cmga1\Desktop\proyecto\LogicLab-Movil-Flutter"
```

Verificar los dispositivos disponibles:

```powershell
flutter devices
```

Ejecutar la aplicación en el dispositivo Android:

```powershell
flutter run -d A34XUT5610001877
```

La aplicación Flutter carga el frontend mediante WebView.

---

# Desarrollo local

Para ejecutar todo el sistema durante el desarrollo:

## 1. Iniciar MySQL

Verificar que el servidor MySQL esté funcionando.

## 2. Iniciar el backend

Ingresar al proyecto backend:

```powershell
cd "C:\Users\cmga1\Desktop\proyecto\LogicLab-backend"
```

Iniciar el servidor:

```powershell
npm run dev
```

El backend estará disponible en:

```text
http://localhost:3001
```

## 3. Iniciar el frontend

Ingresar al proyecto frontend:

```powershell
cd "C:\Users\cmga1\Desktop\proyecto\LogicLab-frontend"
```

Ejecutar:

```powershell
npm run dev -- --host 0.0.0.0
```

El frontend estará disponible en:

```text
http://localhost:5173/
```

Y desde dispositivos de la red:

```text
http://192.168.80.25:5173/
```

## 4. Ejecutar Flutter

Ingresar al proyecto móvil:

```powershell
cd "C:\Users\cmga1\Desktop\proyecto\LogicLab-Movil-Flutter"
```

Ejecutar:

```powershell
flutter run -d A34XUT5610001877
```

---

# Flujo de comunicación

Cuando el usuario utiliza la aplicación desde el navegador:

```text
Navegador
    │
    ▼
React + Vite
    │
    ▼
Axios
    │
    ▼
Node.js + Express
    │
    ▼
MySQL
```

Cuando se utiliza desde la aplicación móvil:

```text
Android
    │
    ▼
Flutter
    │
    ▼
WebView
    │
    ▼
React + Vite
    │
    ▼
Axios
    │
    ▼
Node.js + Express
    │
    ▼
MySQL
```

---

# Comandos principales

## Instalar dependencias

```powershell
npm install
```

## Ejecutar desarrollo

```powershell
npm run dev
```

## Ejecutar desarrollo con acceso desde la red

```powershell
npm run dev -- --host 0.0.0.0
```

## Ejecutar ESLint

```powershell
npm run lint
```

## Crear compilación de producción

```powershell
npm run build
```

## Previsualizar compilación

```powershell
npm run preview
```

---

# Verificación antes de publicar cambios

Antes de realizar un commit se recomienda ejecutar:

```powershell
npm run lint
```

y:

```powershell
npm run build
```

Después verificar el estado de Git:

```powershell
git status
```

---

# Repositorios relacionados

## Frontend

https://github.com/gonzalezcla110312-eng/LogicLab-frontend

## Backend

https://github.com/gonzalezcla110312-eng/LogicLab-backend

## Aplicación móvil Flutter

https://github.com/gonzalezcla110312-eng/LogicLab-Movil-Flutter

---

# Estado actual del proyecto

Actualmente LogicLab cuenta con:

- Frontend desarrollado con React y Vite.
- Backend desarrollado con Node.js y Express.
- Base de datos MySQL.
- Autenticación de usuarios.
- Gestión de clientes.
- Gestión de empleados.
- Gestión de mesas.
- Gestión de pedidos.
- Gestión de platos.
- Gestión de menú.
- Gestión de cocina.
- Gestión de meseros.
- Gestión de ganancias.
- Gestión de PQRS.
- Gestión de reservaciones.
- Aplicación móvil Flutter.
- Integración Flutter mediante WebView.
- Comunicación entre dispositivos mediante red local.
- Persistencia de información en MySQL.

---

# Autor

Proyecto LogicLab.

Sistema desarrollado para la gestión integral de un restaurante.

