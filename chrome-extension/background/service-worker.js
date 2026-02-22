const API_BASE = "http://127.0.0.1:8900/api/v1";

// ── Detected secrets storage (per-tab) ──────────────────────────────
// Map<tabId, Array<{value, type, url, timestamp}>>
const detectedByTab = new Map();

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "achilles-fill",
    title: "Fill from Achilles Vault",
    contexts: ["editable"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "achilles-fill" && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "FILL_FROM_VAULT" });
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

      const project = message.projectId
        ? projects.find((p) => String(p.id) === String(message.projectId))
        : projects[0];
      if (!project) throw new Error("Project not found");

      const env = message.env || "development";
      const key =
        message.key ||
        (s.type || "SECRET").toUpperCase().replace(/[^A-Z0-9]/g, "_") +
          "_" +
          Date.now().toString(36).toUpperCase();

      await apiRequest(
        `/projects/${project.id}/environments/${env}/secrets/${key}`,
        {
          method: "PUT",
          body: JSON.stringify({ key, value: s.value }),
        }
      );
      return { success: true, key, project: project.name, env };
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
