import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AuthProvider } from "../contexts/AuthContext";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import ProtectedRoute from "./ProtectedRoute";
import OrganizationPage from "../pages/OrganizationPage";
import ProjectOverviewPage from "../pages/ProjectOverviewPage";
import TaskDetailPage from "../pages/TaskDetailPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route
              path="/organizations/:organizationId"
              element={<OrganizationPage />}
            />
            <Route
              path="/organizations/:organizationId/projects/:projectId"
              element={<ProjectOverviewPage />}
            />
            <Route
              path="/organizations/:organizationId/projects/:projectId/tasks/:taskId"
              element={<TaskDetailPage />}
            />
          </Route>
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
