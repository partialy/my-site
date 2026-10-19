import { createBrowserRouter, Navigate } from 'react-router-dom';
import { BootGuard, ProtectedGuard, PublicOnlyGuard } from './guards';
import { AdminLayout } from '../layouts/AdminLayout';
import { SetupPage } from '../pages/setup/SetupPage';
import { LoginPage } from '../pages/login/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { SystemConfigPage } from '../pages/system-config/SystemConfigPage';
import { ConfigsPage } from '../pages/configs/ConfigsPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <BootGuard>
        <ProtectedGuard>
          <AdminLayout />
        </ProtectedGuard>
      </BootGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'system-config',
        element: <SystemConfigPage />,
      },
      {
        path: 'configs',
        element: <ConfigsPage />,
      },
    ],
  },
  {
    path: '/login',
    element: (
      <BootGuard>
        <PublicOnlyGuard>
          <LoginPage />
        </PublicOnlyGuard>
      </BootGuard>
    ),
  },
  {
    path: '/setup',
    element: (
      <BootGuard>
        <SetupPage />
      </BootGuard>
    ),
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);
