import { createBrowserRouter, Navigate } from 'react-router-dom';
import { BootGuard, ProtectedGuard, PublicOnlyGuard } from './guards';
import { AdminLayout } from '../layouts/AdminLayout';
import { SetupPage } from '../pages/setup/SetupPage';
import { LoginPage } from '../pages/login/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { SystemConfigPage } from '../pages/system-config/SystemConfigPage';
import { ConfigsPage } from '../pages/configs/ConfigsPage';
import { RequestLogsPage } from '../pages/request-logs/RequestLogsPage';
import { OperationLogsPage } from '../pages/operation-logs/OperationLogsPage';
import { VisitLogsPage } from '../pages/visit-logs/VisitLogsPage';
import { UsersPage } from '../pages/users/UsersPage';
import { FilesPage } from '../pages/files/FilesPage';
import { MenuManagementPage } from '../pages/menus/MenuManagementPage';
import { ApiDocsPage } from '../pages/api-docs/ApiDocsPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';
import { DictionariesPage } from '../pages/dictionaries/DictionariesPage';

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
      {
        path: 'dictionaries',
        element: <DictionariesPage />,
      },
      {
        path: 'request-logs',
        element: <RequestLogsPage />,
      },
      {
        path: 'operation-logs',
        element: <OperationLogsPage />,
      },
      {
        path: 'visit-logs',
        element: <VisitLogsPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'files',
        element: <FilesPage />,
      },
      {
        path: 'menus',
        element: <MenuManagementPage />,
      },
      {
        path: 'api-docs',
        element: <ApiDocsPage />,
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
