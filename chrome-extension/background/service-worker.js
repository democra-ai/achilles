import { getSerializableRules, getRuleSummary } from "../rules/loader.js";

const API_BASE = "http://127.0.0.1:8900/api/v1";

// ── Detected secrets storage (per-tab) ──────────────────────────────
// Map<tabId, Array<{value, type, url, timestamp}>>
const detectedByTab = new Map();
const DEFAULT_ENV = "development";

async function getUserPrefs() {
  const prefs = await chrome.storage.local.get(["lastProjectId", "lastEnv"]);
  return {
    lastProjectId: prefs.lastProjectId ? String(prefs.lastProjectId) : null,
    lastEnv: prefs.lastEnv || DEFAULT_ENV,
  };
}

async function setUserPrefs(patch = {}) {
  const next = {};
  if (Object.prototype.hasOwnProperty.call(patch, "lastProjectId")) {
    next.lastProjectId = patch.lastProjectId ? String(patch.lastProjectId) : null;
  }
  if (Object.prototype.hasOwnProperty.call(patch, "lastEnv")) {
    next.lastEnv = patch.lastEnv || DEFAULT_ENV;
  }
  if (Object.keys(next).length > 0) {
    await chrome.storage.local.set(next);
  }
}

function sanitizeKey(value) {
  const s = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s;
}

function cleanKey(value) {
  return String(value || "").trim();
}

function inferCategory(explicitCategory, typeName = "") {
  if (explicitCategory && ["secret", "api_key", "env_var", "token"].includes(explicitCategory)) {
    return explicitCategory;
  }
  const t = String(typeName || "").toLowerCase();
  if (t.includes("token") || t.includes("pat") || t.includes("jwt")) return "token";
  if (t.includes("api") || t.includes("access")) return "api_key";
  return "secret";
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const out = [];
  for (const tag of tags) {
    const t = String(tag || "").trim().toLowerCase();
    if (!t) continue;
    if (!out.includes(t)) out.push(t);
  }
  return out.slice(0, 24);
}

function normalizeSourceTag(source) {
  const raw = String(source || "").trim().toLowerCase();
  if (!raw) return "";
  const normalized = raw
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[\/:@|,;\s]/)[0]
    .split(".")[0];
  return normalized ? `source:${normalized}` : "";
}

async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// ── Context menu ─────────────────────────────────────────────────────

function ensureContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "achilles-fill",
      title: "Fill from Achilles Vault",
      contexts: ["editable"],
    });
    chrome.contextMenus.create({
      id: "achilles-import-selection",
      title: "Import Selection to Achilles Vault",
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  ensureContextMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "achilles-fill" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "FILL_FROM_VAULT" });
    return;
  }
  if (info.menuItemId === "achilles-import-selection" && tab?.id) {
    const text = (info.selectionText || "").trim();
    if (!text) return;
    chrome.tabs.sendMessage(tab.id, {
      type: "IMPORT_SELECTED_TEXT",
      text,
    });
  }
});

// ── Message handler ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true; // async response
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case "HEALTH_CHECK":
      try {
        await fetch("http://127.0.0.1:8900/health");
        return { online: true };
      } catch {
        return { online: false };
      }

    case "GET_PROJECTS":
      return await apiRequest("/projects");

    case "GET_USER_PREFS":
      return await getUserPrefs();

    case "SET_USER_PREFS":
      await setUserPrefs({
        lastProjectId: message.lastProjectId,
        lastEnv: message.lastEnv,
      });
      return { ok: true };

    case "GET_SECRETS":
      return await apiRequest(
        `/projects/${message.projectId}/environments/${message.env}/secrets`
      );

    case "GET_SECRET_VALUE":
      return await apiRequest(
        `/projects/${message.projectId}/environments/${message.env}/secrets/${message.key}`
      );

    // ── Detection messages from content script ──────────────────────

    case "DETECTED_SECRETS": {
      const tabId = sender?.tab?.id;
      if (!tabId) return { ok: true };
      const existing = detectedByTab.get(tabId) || [];
      const newItems = (message.secrets || []).filter(
        (s) => !existing.some((e) => e.value === s.value)
      );
      const all = [...existing, ...newItems];
      detectedByTab.set(tabId, all);

      // Update badge
      chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
      chrome.action.setBadgeText({
        text: all.length > 0 ? String(all.length) : "",
        tabId,
      });
      return { ok: true, count: all.length };
    }

    case "GET_DETECTED": {
      const tabId = message.tabId;
      return { secrets: detectedByTab.get(tabId) || [] };
    }

    case "IMPORT_SECRET": {
      // Import a detected secret into the vault
      const s = message.secret;
      if (!s || !s.value) throw new Error("No secret provided");

      // Get first available project
      const projects = await apiRequest("/projects");
      if (!Array.isArray(projects) || projects.length === 0) {
        throw new Error("No projects. Create one in the vault first.");
      }

      const prefs = await getUserPrefs();
      const preferredProjectId = message.projectId || prefs.lastProjectId;
      const project = preferredProjectId
        ? projects.find((p) => String(p.id) === String(preferredProjectId))
        : projects[0];
      if (!project) throw new Error("Project not found");

      const env = message.env || prefs.lastEnv || DEFAULT_ENV;
      const explicitKey = message.key
        ? cleanKey(message.key)
        : sanitizeKey(s.suggestedKey || s.tokenName || "");
      const defaultKeyPrefix = sanitizeKey(s.type || "SECRET") || "SECRET";
      const key = explicitKey || `${defaultKeyPrefix}_${Date.now().toString(36).toUpperCase()}`;
      if (!/^[a-zA-Z0-9_./-]+$/.test(key)) throw new Error("Invalid key format");
      const category = inferCategory(message.category || s.category, s.type);
      const sourceTag = normalizeSourceTag(message.source || s.source);
      const baseTags = normalizeTags([
        ...(s.tags || []),
        ...(message.tags || []),
        ...(sourceTag ? [sourceTag] : []),
      ]);
      const permissions = Array.isArray(s.permissions)
        ? s.permissions.map((p) => String(p).trim()).filter(Boolean)
        : [];
      const descriptionParts = [
        message.description ? String(message.description).trim() : "",
        s.tokenName ? `name=${s.tokenName}` : "",
        permissions.length > 0 ? `permissions=${permissions.join(",")}` : "",
      ].filter(Boolean);
      const description = descriptionParts.join(" | ").slice(0, 500);

      await apiRequest(
        `/projects/${project.id}/environments/${env}/secrets/${key}`,
        {
          method: "PUT",
          body: JSON.stringify({
            key,
            value: s.value,
            category,
            description,
            tags: baseTags,
          }),
        }
      );
      await setUserPrefs({ lastProjectId: project.id, lastEnv: env });
      return { success: true, key, project: project.name, env, category, tags: baseTags, description };
    }

    case "SET_SECRET": {
      if (!message.projectId || !message.env || !message.key || !Object.prototype.hasOwnProperty.call(message, "value")) {
        throw new Error("Missing projectId/env/key/value");
      }
      const key = cleanKey(message.key);
      if (!key) throw new Error("Invalid key");
      if (!/^[a-zA-Z0-9_./-]+$/.test(key)) throw new Error("Invalid key format");
      const sourceTag = normalizeSourceTag(message.source);

      const payload = {
        key,
        value: String(message.value),
        category: inferCategory(message.category, ""),
        description: String(message.description || ""),
        tags: normalizeTags([
          ...(message.tags || []),
          ...(sourceTag ? [sourceTag] : []),
        ]),
      };
      const result = await apiRequest(
        `/projects/${message.projectId}/environments/${message.env}/secrets/${key}`,
        { method: "PUT", body: JSON.stringify(payload) }
      );
      await setUserPrefs({ lastProjectId: message.projectId, lastEnv: message.env });
      return result;
    }

    case "DELETE_SECRET": {
      if (!message.projectId || !message.env || !message.key) {
        throw new Error("Missing projectId/env/key");
      }
      const resp = await fetch(
        `${API_BASE}/projects/${message.projectId}/environments/${message.env}/secrets/${encodeURIComponent(message.key)}`,
        { method: "DELETE", headers: { "Content-Type": "application/json" } }
      );
      if (!resp.ok && resp.status !== 204) {
        throw new Error(`API error: ${resp.status}`);
      }
      return { ok: true };
    }

    case "GET_FILL_SECRETS": {
      // Return all secrets across all projects/environments for the fill picker
      const allProjects = await apiRequest("/projects");
      if (!Array.isArray(allProjects)) return { secrets: [] };

      const envs = ["development", "staging", "production"];
      const results = [];

      for (const proj of allProjects) {
        for (const env of envs) {
          try {
            const secrets = await apiRequest(
              `/projects/${proj.id}/environments/${env}/secrets`
            );
            if (Array.isArray(secrets)) {
              for (const s of secrets) {
                results.push({
                  key: s.key,
                  env,
                  projectId: proj.id,
                  projectName: proj.name,
                });
              }
            }
          } catch {
            // skip
          }
        }
      }
      return { secrets: results };
    }

    // ── Rules messages ─────────────────────────────────────────────────

    case "GET_RULES":
      return { rules: await getSerializableRules() };

    case "GET_RULE_SUMMARY":
      return { summary: await getRuleSummary() };

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// Clean up detected secrets when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  detectedByTab.delete(tabId);
});

// Clear badge when tab is updated (new navigation)
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    detectedByTab.delete(tabId);
    chrome.action.setBadgeText({ text: "", tabId });
  }
});
