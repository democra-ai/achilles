import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Vault from "./pages/Vault";
import VaultApiKeys from "./pages/VaultApiKeys";
import Tokens from "./pages/Tokens";
import Passwords from "./pages/Passwords";
import Certificates from "./pages/Certificates";
import EnvVars from "./pages/EnvVars";
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
          <Route path="api-keys-vault" element={<VaultApiKeys />} />
          <Route path="tokens" element={<Tokens />} />
          <Route path="passwords" element={<Passwords />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="env-vars" element={<EnvVars />} />
          <Route path="trash" element={<Trash />} />
          <Route path="api-keys" element={<ApiKeys />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
