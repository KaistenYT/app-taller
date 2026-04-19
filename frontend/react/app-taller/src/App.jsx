import { useEffect, useState } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthInitializer } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import ReceptionFormPage from "./pages/ReceptionFormPage";
import HistoryPage from "./pages/HistoryPage";
import ReportListPage from "./pages/ReportListPage";
import ReportViewPage from "./pages/ReportViewPage";
import UserManagementPage from "./pages/UserManagementPage";
import BudgetFormPage from "./pages/BudgetFormPage";
import BudgetViewPage from "./pages/BudgetViewPage";
import BudgetListPage from "./pages/BudgetListPage";
import BudgetLogPage from "./pages/BudgetLogPage";
import SettingsPage from "./pages/SettingsPage";
import BudgetDashboardPage from "./pages/BudgetDashboardPage";
import ClientListPage from "./pages/ClientListPage";
import ClientFormPage from "./pages/ClientFormPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import DeviceListPage from "./pages/DeviceListPage";
import DeviceFormPage from "./pages/DeviceFormPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import DeviceSearchPage from "./pages/DeviceSearchPage";
import NotFoundPage from "./pages/NotFoundPage";
import { getSetupStatus } from "./api/httpApi";

export default function App() {
  const [isInitialized, setIsInitialized] = useState(null);

  useEffect(() => {
    async function checkSetup() {
      try {
        const { isInitialized } = await getSetupStatus();
        setIsInitialized(isInitialized);
      } catch (error) {
        setIsInitialized(true); 
      }
    }
    checkSetup();
  }, []);

  if (isInitialized === null) return null;

  return (
    <ThemeProvider defaultTheme="dark" storageKey="taller-ui-theme">
      <AuthInitializer>
        <SocketProvider>
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={!isInitialized ? <Navigate to="/setup" replace /> : <Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/setup" element={isInitialized ? <Navigate to="/login" replace /> : <SetupPage />} />
              <Route path="/report/:id" element={<ReportViewPage />} />
              <Route path="/budget/:id" element={<BudgetViewPage />} />

              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/reception/new" element={<ReceptionFormPage />} />
                  <Route path="/receptions/new" element={<ReceptionFormPage />} />
                  <Route path="/reception/:id" element={<ReceptionFormPage />} />
                  <Route
                    path="/receptions/:id/edit"
                    element={<ReceptionFormPage />}
                  />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/reports" element={<ReportListPage />} />
                  <Route path="/budgets" element={<BudgetListPage />} />
                  <Route path="/budget-logs" element={<BudgetLogPage />} />
                  <Route path="/users" element={<UserManagementPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/receptions/:receptionId/budgets/new" element={<BudgetFormPage />} />
                  <Route path="/budgets/:budgetId/edit" element={<BudgetFormPage />} />
                  <Route path="/budgets/dashboard" element={<BudgetDashboardPage />} />
                  
                  {/* Client Routes */}
                  <Route path="/clients" element={<ClientListPage />} />
                  <Route path="/clients/new" element={<ClientFormPage />} />
                  <Route path="/clients/:id" element={<ClientDetailPage />} />
                  <Route path="/clients/:id/edit" element={<ClientFormPage />} />
                  
                  {/* Device Routes */}
                  <Route path="/devices" element={<DeviceListPage />} />
                  <Route path="/devices/new" element={<DeviceFormPage />} />
                  <Route path="/devices/:id" element={<DeviceDetailPage />} />
                  <Route path="/devices/:id/edit" element={<DeviceFormPage />} />
                  <Route path="/devices/search" element={<DeviceSearchPage />} />
                </Route>
              </Route>

              {/* Ruta por defecto → 404 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </HashRouter>
        </SocketProvider>
      </AuthInitializer>
    </ThemeProvider>
  );
}
