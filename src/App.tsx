import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Patients } from "./pages/Patients";
import { PatientDetail } from "./pages/PatientDetail";
import { PatientForm } from "./pages/PatientForm";
import { PatientReview } from "./pages/PatientReview";
import { PublicForm } from "./pages/PublicForm";
import { Settings } from "./pages/Settings";
import { Providers } from "./pages/Providers";
import { ProviderForm } from "./pages/ProviderForm";
import { ProviderDetail } from "./pages/ProviderDetail";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/form/:token" element={<PublicForm />} />

          {/* Protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Pacientes */}
              <Route path="/patients" element={<Patients />} />
              <Route path="/patients/new" element={<PatientForm />} />
              <Route path="/patients/:id/review" element={<PatientReview />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:id/edit" element={<PatientForm />} />

              {/* Prestadores */}
              <Route path="/providers" element={<Providers />} />
              <Route path="/providers/new" element={<ProviderForm />} />
              <Route path="/providers/:id" element={<ProviderDetail />} />
              <Route path="/providers/:id/edit" element={<ProviderForm />} />

              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}