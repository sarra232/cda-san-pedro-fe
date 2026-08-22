# 💻 CDA San Pedro Frontend (Web App)

Aplicación web progresiva (PWA / SPA) de grado de producción para **CDA San Pedro S.A.S.**, desarrollada con **React 18**, **TypeScript**, **Vite 5**, **Tailwind CSS** y arquitectura **Mobile-First**.

---

## 🛠️ Stack Tecnológico

- **Core**: React 18 + TypeScript 5
- **Build Tool & Bundler**: Vite 5
- **Estilos & UI**: Tailwind CSS + Custom Design System + Lucide Icons
- **Gestión de Estado**: Zustand (Autenticación, sesión y preferencias)
- **Consultas & Caching**: TanStack Query (React Query)
- **Enrutamiento**: React Router DOM v6
- **Cliente HTTP**: Axios con interceptores de Token JWT y manejo centralizado de errores

---

## 📱 Filosofía de Diseño: Mobile-First Obligatorio

La interfaz está construida siguiendo estrictos principios de experiencia de usuario en pistas y ventanillas:
1. **Navegación Móvil Adaptativa**: Menú deslizante tipo *Drawer* en pantallas `< 768px` con backdrop blur.
2. **Cero Competencia de Scrolling**: Las pantallas complejas (Recepción, Pista, Facturación) utilizan **Pestañas (Tabs)** o **Modales Pop-up** para evitar formularios largos y tablas infinitas en la misma vista.
3. **Componentes Híbridos**: Tablas completas y ordenadas en escritorio (`>= 768px`) y tarjetas táctiles con badges en celulares y tablets.
4. **Prevención de Desbordamiento**: Manejo estricto de `min-w-0 flex-1` y `overflow-x-hidden` en todos los contenedores flexibles.

---

## 🎨 Identidad Visual Oficial

| Elemento | Token / Hex | Muestra |
| :--- | :--- | :--- |
| **Negro Carbón** | `#0A0A0A` / `#111827` | Fondo principal oscuro premium (`cda-dark-950`, `cda-dark-900`) |
| **Amarillo Ámbar CDA** | `#F59E0B` / `#D97706` | Acentos, botones primarios y placas (`cda-yellow-500`) |
| **Blanco Puro** | `#FFFFFF` | Textos primarios y encabezados |
| **Plata / Slate** | `#E2E8F0` / `#94A3B8` | Textos secundarios y bordes sutiles |
| **Verde Aprobado** | `#10B981` | Estados RTM conformes y facturas pagadas |
| **Rojo Rechazado** | `#EF4444` | Defectos tipo A en inspección técnica |

---

## 🧭 Módulos & Rutas de la Aplicación

```
/login                 # Inicio de sesión con tipo/número de documento y contraseña
/dashboard             # Dashboard ejecutivo (KPIs, turnos de hoy, recaudos)
/recepcion             # Recepción de vehículos, búsqueda por placa y emisión de turnos
/pista                 # Pista de inspección: 4 pruebas NTC 5375 y certificación RTM
/clientes              # Directorio de clientes y vehículos registrados
/facturacion           # Caja de recaudo, liquidación con tarifa dinámica y PDF
/servicios             # Catálogo de servicios y tarifas oficiales (CRUD Administrador)
/reportes              # Reportes consolidados y analíticas por fecha (Admin y Director)
/notificaciones        # Bandeja de alertas y mensajes de WhatsApp (Admin)
/usuarios              # Directorio y gestión de personal (Admin)
```

---

## 📂 Estructura del Código Fuente

```
src/
├── assets/                  # Logotipos oficiales (LogoCDA.PNG, LOGOCDAOPT.PNG)
├── components/              # Componentes compartidos
│   ├── common/              # Pagination, Badges, Loaders
│   └── layout/              # AppLayout, Navbar, Sidebar
├── features/                # Módulos por dominio
│   ├── auth/                # LoginPage
│   ├── billing/             # BillingPage (Liquidación, Historial, Tarifas)
│   ├── clients/             # ClientsVehiclesPage
│   ├── dashboard/           # DashboardPage
│   ├── inspection/          # InspectionPage (Modal de 4 pruebas NTC 5375)
│   ├── notifications/       # NotificationsPage
│   ├── reception/           # ReceptionPage (Tabs: Nuevo Ingreso vs Turnos)
│   ├── reports/             # ReportsPage
│   ├── services/            # ServicesCatalogPage (Catálogo y CRUD de Tarifas)
│   └── users/               # UsersPage & UsuarioModal
├── routes/                  # AppRoutes y Guards (PrivateRoute, AdminRoute)
├── services/                # Servicios API Axios tipados
├── store/                   # useAuthStore (Zustand)
├── types/                   # Interfaces TypeScript (auth, ingreso, tarifa, etc.)
└── utils/                   # Formateadores (placas, moneda COP, teléfonos)
```

---

## 💻 Desarrollo Local

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Variables de Entorno (`.env`)
```env
VITE_API_URL=http://localhost:8080/api
```

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación iniciará en `http://localhost:5173`.

### 4. Compilación para Producción (Typecheck + Vite Build)
```bash
npm run build
```
Genera la carpeta `dist/` optimizada lista para ser servida por Nginx.
