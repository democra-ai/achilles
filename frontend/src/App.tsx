import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Vault from "./pages/Vault";
import Secrets from "./pages/Secrets";
import VaultApiKeys from "./pages/VaultApiKeys";
import EnvVars from "./pages/EnvVars";
import Tokens from "./pages/Tokens";
import Trash from "./pages/Trash";
import ApiKeys from "./pages/ApiKeys";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="vault" element={<Vault />} />
          <Route path="secrets" element={<Secrets />} />
          <Route path="vault-api-keys" element={<VaultApiKeys />} />
          <Route path="env-vars" element={<EnvVars />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="trash" element={<Trash />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
