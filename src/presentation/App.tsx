import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SpreadsheetRoute } from "./components/SpreadsheetRoute";
import { LoginPage } from "./pages/LoginPage";
import { SetupPage } from "./pages/SetupPage";
import { HomePage } from "./pages/HomePage";
import { NewPartyPage } from "./pages/NewPartyPage";
import { PartyPage } from "./pages/PartyPage";
import { ParticipantReportPage } from "./pages/ParticipantReportPage";
import { SharedReportPage } from "./pages/SharedReportPage";
import { SamplePage } from "./pages/SamplePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="r/:payload" element={<SharedReportPage />} />
      <Route path="exemplo" element={<SamplePage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="setup" element={<SetupPage />} />
        <Route element={<SpreadsheetRoute />}>
          <Route index element={<HomePage />} />
          <Route path="role/novo" element={<NewPartyPage />} />
          <Route path="role/:id" element={<PartyPage />} />
          <Route path="role/:id/p/:pid" element={<ParticipantReportPage />} />
        </Route>
      </Route>
      <Route path="404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
