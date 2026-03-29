import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthInitializer } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterCompanyPage from "./pages/RegisterCompanyPage";
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

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="taller-ui-theme">
      <AuthInitializer>
        <SocketProvider>
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              {/* Rutas públicas */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register-company" element={<RegisterCompanyPage />} />
              <Route path="/report/:id" element={<ReportViewPage />} />
              <Route path="/budget/:id" element={<BudgetViewPage />} />

              {/* Rutas protegidas */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<DashboardPage />} />
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
                </Route>
              </Route>

              {/* Ruta por defecto → landing */}
              <Route path="*" element={<LandingPage />} />
            </Routes>
          </HashRouter>
        </SocketProvider>
      </AuthInitializer>
    </ThemeProvider>
  );
}
