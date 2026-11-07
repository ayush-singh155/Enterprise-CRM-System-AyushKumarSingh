import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ResourcePage } from './pages/ResourcePage';
import { UsersPage } from './pages/UsersPage';
import { LeadsPage } from './pages/LeadsPage';
import { LeadDetailPage } from './pages/LeadDetailPage';
import { PipelinePage } from './pages/PipelinePage';
import { CustomersPage } from './pages/CustomersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/:id" element={<LeadDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="deals" element={<ResourcePage resource="deals" />} />
          <Route path="pipeline" element={<PipelinePage />} />
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="team" element={<Navigate to="/users" replace />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
