import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
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

export default function App() {
  return (
    <AuthProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
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
              <Route path="/receptions/:receptionId/budgets/new" element={<BudgetFormPage />} />
              <Route path="/budgets/:budgetId/edit" element={<BudgetFormPage />} />
            </Route>
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
