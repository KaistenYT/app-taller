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

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/report/:id" element={<ReportViewPage />} />

          {/* Protected routes */}
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
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
