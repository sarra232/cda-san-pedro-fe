import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LoginPage } from '../features/auth/LoginPage';
import { EstablecerPasswordPage } from '../features/auth/EstablecerPasswordPage';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ReceptionPage } from '../features/reception/ReceptionPage';
import { InspectionPage } from '../features/inspection/InspectionPage';
import { ClientsVehiclesPage } from '../features/clients/ClientsVehiclesPage';
import { BillingPage } from '../features/billing/BillingPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { ServicesCatalogPage } from '../features/services/ServicesCatalogPage';
import { ProveedoresPage } from '../features/expenses/ProveedoresPage';
import { CuentasPorPagarPage } from '../features/expenses/CuentasPorPagarPage';
import { HRPage } from '../features/hr/HRPage';
import { ProfilePage } from '../features/profile/ProfilePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {

  const { user, token, checkTokenValidity } = useAuthStore();
  const isAuthed = Boolean(user && token && checkTokenValidity());
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token, checkTokenValidity } = useAuthStore();
  const isAuthed = Boolean(user && token && checkTokenValidity());
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (user?.rol !== 'ADMINISTRADOR') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const { user } = useAuthStore();
  const defaultHome = user?.rol === 'TECNICO_PISTA' ? '/pista' : '/dashboard';

  return (
    <Routes>
      {/* Rutas Públicas de Autenticación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/establecer-password" element={<EstablecerPasswordPage />} />
      <Route path="/restablecer-password" element={<EstablecerPasswordPage />} />
      <Route path="/recuperar-password" element={<LoginPage />} />

      {/* Rutas Autenticadas bajo AppLayout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to={defaultHome} replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="recepcion" element={<ReceptionPage />} />
        <Route path="pista" element={<InspectionPage />} />
        <Route path="ordenes" element={<Navigate to="/pista" replace />} />
        <Route path="clientes" element={<ClientsVehiclesPage />} />
        <Route path="facturacion" element={<BillingPage />} />
        <Route path="servicios" element={<ServicesCatalogPage />} />
        <Route path="tarifas" element={<Navigate to="/servicios" replace />} />
        
        {/* Módulo de Talento Humano y Nómina (Admin y Director Técnico) */}
        <Route
          path="talento-humano"
          element={
            <AdminRoute>
              <HRPage />
            </AdminRoute>
          }
        />
        <Route path="rrhh" element={<Navigate to="/talento-humano" replace />} />
        <Route path="nomina" element={<Navigate to="/talento-humano" replace />} />

        {/* Rutas exclusivas de Administrador */}
        <Route
          path="proveedores"
          element={
            <AdminRoute>
              <ProveedoresPage />
            </AdminRoute>
          }
        />
        <Route
          path="cuentas-por-pagar"
          element={
            <AdminRoute>
              <CuentasPorPagarPage />
            </AdminRoute>
          }
        />
        <Route
          path="reportes"
          element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          }
        />
        <Route path="notificaciones" element={<AdminRoute><NotificationsPage /></AdminRoute>} />
        <Route path="usuarios" element={<Navigate to="/talento-humano" replace />} />
        <Route path="personal" element={<Navigate to="/talento-humano" replace />} />

        {/* Módulo de Perfil de Usuario (Accesible por cualquier usuario autenticado) */}
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="profile" element={<Navigate to="/perfil" replace />} />
      </Route>

      {/* Fallback */}

      <Route
        path="*"
        element={<Navigate to={user ? defaultHome : "/login"} replace />}
      />
    </Routes>
  );
}
