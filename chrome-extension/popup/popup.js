let currentProject = null;
let currentEnv = "development";
let revealedSecrets = {};
let activeTab = "vault";
const DEFAULT_ENV = "development";

const CATEGORY_LABEL = {
  secret: "Secret",
  api_key: "API Key",
  env_var: "Env Var",
  token: "Token",
};

// Init — local mode, no login required
document.addEventListener("DOMContentLoaded", async () => {
  await checkHealth();
  showMainView();
  setupEventListeners();
  loadDetectedSecrets();
});

// Health Check
async function checkHealth() {
  const indicator = document.getElementById("status-indicator");
  const dot = indicator.querySelector(".status-dot");
  const text = indicator.querySelector(".status-text");

  try {
    const resp = await chrome.runtime.sendMessage({ type: "HEALTH_CHECK" });
    if (resp.online) {
      dot.className = "status-dot online";
      text.textContent = "Online";
    } else {
      dot.className = "status-dot offline";
      text.textContent = "Offline";
    }
  } catch {
    dot.className = "status-dot offline";
    text.textContent = "Error";
  }
}

function showMainView() {
  document.getElementById("main-view").style.display = "flex";
  document.getElementById("main-view").style.flexDirection = "column";
  document.getElementById("main-view").style.flex = "1";
  loadProjects();
}

async function getUserPrefs() {
  try {
    const resp = await chrome.runtime.sendMessage({ type: "GET_USER_PREFS" });
    return {
      lastProjectId: resp?.lastProjectId ? String(resp.lastProjectId) : null,
      lastEnv: resp?.lastEnv || DEFAULT_ENV,
    };
  } catch {
    return { lastProjectId: null, lastEnv: DEFAULT_ENV };
  }
}

async function setUserPrefs(patch) {
  try {
    await chrome.runtime.sendMessage({ type: "SET_USER_PREFS", ...patch });
  } catch {
    // no-op
  }
}

function setActiveEnv(env, options = {}) {
  const { persist = false, shouldLoad = true } = options;
  const targetEnv = env || DEFAULT_ENV;
  currentEnv = targetEnv;

  document.querySelectorAll(".env-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.env === targetEnv);
  });

  if (persist) {
    setUserPrefs({ lastEnv: targetEnv });
  }
  if (shouldLoad && currentProject) {
    loadSecrets();
  }
}

// Event Listeners
function setupEventListeners() {
  // Open App — launch native desktop app via custom URL scheme
  document.getElementById("open-app").addEventListener("click", () => {
    chrome.tabs.create({ url: "achillesvault://open" });
  });

  // Project select
  document.getElementById("project-select").addEventListener("change", (e) => {
    currentProject = e.target.value || null;
    setUserPrefs({ lastProjectId: currentProject || null });
    if (currentProject) {
      loadSecrets();
    } else {
      showEmptyState();
    }
  });

  // Environment tabs
  document.querySelectorAll(".env-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveEnv(tab.dataset.env, { persist: true, shouldLoad: true });
    });
  });

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    filterSecrets(e.target.value);
  });

  // Tab bar
  document.querySelectorAll(".tab-bar .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchTab(tab.dataset.tab);
    });
  });
}

// ── Tab switching ────────────────────────────────────────────────────

function switchTab(tabName) {
  activeTab = tabName;
  document.querySelectorAll(".tab-bar .tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === tabName);
  });
  document.getElementById("vault-tab").style.display = tabName === "vault" ? "flex" : "none";
  document.getElementById("detected-tab").style.display = tabName === "detected" ? "flex" : "none";

  if (tabName === "detected") {
    loadDetectedSecrets();
  }
}

// ── Detected secrets ─────────────────────────────────────────────────

async function loadDetectedSecrets() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    const resp = await chrome.runtime.sendMessage({
      type: "GET_DETECTED",
      tabId: tab.id,
    });

    const secrets = resp?.secrets || [];
    const badge = document.getElementById("detected-count");

    if (secrets.length > 0) {
      badge.textContent = String(secrets.length);
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }

    renderDetectedSecrets(secrets);
  } catch {
    // silently fail
  }
}

function severityColor(severity) {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high": return "#f97316";
    case "medium": return "#eab308";
    case "low": return "#6b7280";
    default: return "#6b7280";
  }
}

function renderDetectedSecrets(secrets) {
  const list = document.getElementById("detected-list");

  if (secrets.length === 0) {
    list.innerHTML = `<div class="empty-state"><p>No secrets detected on this page</p></div>`;
    return;
  }

  list.innerHTML = secrets
    .map(
      (s, i) => {
        const rule = s.matchedRule;
        const severityBadge = rule && rule.severity
          ? `<span class="detected-severity" style="color:${severityColor(rule.severity)};border-color:${severityColor(rule.severity)}33;background:${severityColor(rule.severity)}18">${escapeHtml(rule.severity.toUpperCase())}</span>`
          : "";
        const ruleDetail = rule
          ? `<div class="detected-rule-detail">
              <span class="detected-rule-id" title="${escapeHtml(rule.description || "")}">${escapeHtml(rule.id)}</span>
              ${rule.platform ? `<span class="detected-rule-platform">${escapeHtml(rule.platform)}</span>` : ""}
              ${severityBadge}
              ${rule.reference ? `<a class="detected-rule-ref" href="${escapeHtml(rule.reference)}" target="_blank" title="Reference docs">docs</a>` : ""}
            </div>`
          : "";
        return `
    <div class="detected-item" data-index="${i}">
      <div class="detected-info">
        <span class="detected-type">${escapeHtml(s.type)}</span>
        ${s.source ? `<span class="detected-type detected-source">${escapeHtml(String(s.source))}</span>` : ""}
        ${s.tokenName ? `<span class="detected-type detected-name">${escapeHtml(String(s.tokenName))}</span>` : ""}
        <code class="detected-value">${escapeHtml(maskValue(s.value))}</code>
        ${ruleDetail}
      </div>
      <button class="action-btn import-btn" data-index="${i}" title="Import to Vault">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </button>
    </div>
  `;
      }
    )
    .join("");

  // Attach import handlers
  list.querySelectorAll(".import-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      const secret = secrets[idx];
      if (!secret) return;

      btn.disabled = true;
      try {
        const resp = await chrome.runtime.sendMessage({
          type: "IMPORT_SECRET",
          secret,
          projectId: currentProject || undefined,
          env: currentEnv,
        });
        if (resp.error) {
          alert("Import failed: " + resp.error);
        } else {
          btn.classList.add("imported");
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
          btn.title = `Imported as ${resp.key}`;
        }
      } catch (err) {
        alert("Import failed: " + err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });
}

function maskValue(value) {
  if (value.length <= 12) return value;
  return value.slice(0, 8) + "..." + value.slice(-4);
}

// Load Projects
async function loadProjects() {
  try {
    const [projects, prefs] = await Promise.all([
      chrome.runtime.sendMessage({ type: "GET_PROJECTS" }),
      getUserPrefs(),
    ]);
    if (projects.error) return;

    setActiveEnv(prefs.lastEnv || DEFAULT_ENV, { persist: false, shouldLoad: false });

    const projectList = Array.isArray(projects) ? projects : [];
    const select = document.getElementById("project-select");
    select.innerHTML = "";
    projectList.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = String(p.id);
      opt.textContent = p.name;
      select.appendChild(opt);
    });

    if (projectList.length === 0) {
      currentProject = null;
      showEmptyState("No projects found");
      return;
    }

    const preferredProject = prefs.lastProjectId
      ? projectList.find((p) => String(p.id) === String(prefs.lastProjectId))
      : null;
    const selectedProject = preferredProject || projectList[0];
    currentProject = String(selectedProject.id);
    select.value = currentProject;
    setUserPrefs({
      lastProjectId: currentProject,
      lastEnv: currentEnv,
    });
    loadSecrets();
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

// Load Secrets
async function loadSecrets() {
  if (!currentProject) return;
  revealedSecrets = {};

  try {
    const secrets = await chrome.runtime.sendMessage({
      type: "GET_SECRETS",
      projectId: currentProject,
      env: currentEnv,
    });

    if (secrets.error) {
      showEmptyState(secrets.error);
      return;
    }

    renderSecrets(Array.isArray(secrets) ? secrets : []);
  } catch (err) {
    showEmptyState("Failed to load secrets");
  }
}

// Render Secrets
function renderSecrets(secrets) {
  const list = document.getElementById("secrets-list");
  window._allSecrets = secrets;

  if (secrets.length === 0) {
    showEmptyState("No secrets in this environment");
    return;
  }

  list.innerHTML = secrets
    .map(
      (s) => `
    <div class="secret-item" data-key="${s.key}">
      <div>
        <div class="secret-key">${s.key}</div>
        <div class="secret-meta">
          <span class="meta-chip meta-chip-category">${escapeHtml(CATEGORY_LABEL[s.category] || "Secret")}</span>
          <span class="meta-chip">v${s.version}</span>
          ${(Array.isArray(s.tags) ? s.tags : []).slice(0, 4).map((tag) => `<span class="meta-chip meta-chip-tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
        ${s.description ? `<div class="secret-desc">${escapeHtml(s.description)}</div>` : ""}
      </div>
      <div class="secret-actions">
        <button class="action-btn" data-action="reveal" data-key="${s.key}" title="Reveal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="action-btn" data-action="copy" data-key="${s.key}" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="action-btn" data-action="edit" data-key="${s.key}" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Attach event handlers
  list.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const key = btn.dataset.key;

      if (action === "reveal") {
        await toggleReveal(key);
      } else if (action === "copy") {
        await copySecret(key);
        btn.classList.add("copied");
        setTimeout(() => btn.classList.remove("copied"), 1500);
      } else if (action === "edit") {
        await editSecret(key);
      }
    });
  });
}

// Toggle Reveal
async function toggleReveal(key) {
  const list = document.getElementById("secrets-list");
  const existing = list.querySelector(`.secret-value-row[data-key="${key}"]`);

  if (existing) {
    existing.remove();
    delete revealedSecrets[key];
    return;
  }

  try {
    const secret = await chrome.runtime.sendMessage({
      type: "GET_SECRET_VALUE",
      projectId: currentProject,
      env: currentEnv,
      key,
    });

    if (secret.error) return;
    revealedSecrets[key] = secret.value;

    const item = list.querySelector(`.secret-item[data-key="${key}"]`);
    if (item) {
      const valueRow = document.createElement("div");
      valueRow.className = "secret-value-row";
      valueRow.dataset.key = key;
      valueRow.innerHTML = `<div class="secret-value">${escapeHtml(secret.value || "")}</div>`;
      item.after(valueRow);
    }
  } catch (err) {
    console.error("Failed to reveal secret:", err);
  }
}

// Copy Secret
async function copySecret(key) {
  try {
    let value = revealedSecrets[key];
    if (!value) {
      const secret = await chrome.runtime.sendMessage({
        type: "GET_SECRET_VALUE",
        projectId: currentProject,
        env: currentEnv,
        key,
      });
      value = secret.value;
    }
    await navigator.clipboard.writeText(value || "");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

async function editSecret(oldKey) {
  const meta = (window._allSecrets || []).find((s) => s.key === oldKey);
  if (!meta || !currentProject) return;

  const keyInput = window.prompt("Edit key", oldKey);
  if (keyInput === null) return;
  const newKey = keyInput.trim();
  if (!newKey) return;

  const categoryInput = window.prompt(
    "Category: secret / api_key / token / env_var",
    meta.category || "secret"
  );
  if (categoryInput === null) return;
  const category = categoryInput.trim().toLowerCase();
  if (!["secret", "api_key", "token", "env_var"].includes(category)) {
    alert("Invalid category");
    return;
  }

  const descInput = window.prompt("Description", meta.description || "");
  if (descInput === null) return;
  const tagsInput = window.prompt(
    "Tags (comma separated)",
    Array.isArray(meta.tags) ? meta.tags.join(", ") : ""
  );
  if (tagsInput === null) return;
  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const currentValResp = await chrome.runtime.sendMessage({
    type: "GET_SECRET_VALUE",
    projectId: currentProject,
    env: currentEnv,
    key: oldKey,
  });
  if (currentValResp?.error) {
    alert("Load value failed: " + currentValResp.error);
    return;
  }

  const valueInput = window.prompt("Secret value", currentValResp.value || "");
  if (valueInput === null) return;
  const value = valueInput;
  if (!value) {
    alert("Value cannot be empty");
    return;
  }

  const saveResp = await chrome.runtime.sendMessage({
    type: "SET_SECRET",
    projectId: currentProject,
    env: currentEnv,
    key: newKey,
    value,
    description: descInput,
    tags,
    category,
  });
  if (saveResp?.error) {
    alert("Save failed: " + saveResp.error);
    return;
  }

  if (newKey !== oldKey) {
    const delResp = await chrome.runtime.sendMessage({
      type: "DELETE_SECRET",
      projectId: currentProject,
      env: currentEnv,
      key: oldKey,
    });
    if (delResp?.error) {
      alert("Renamed but failed to delete old key: " + delResp.error);
    }
  }

  await loadSecrets();
}

// Filter
function filterSecrets(query) {
  const secrets = window._allSecrets || [];
  const filtered = secrets.filter(
    (s) =>
      s.key.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase()))
  );
  renderSecrets(filtered);
}

// Helpers
function showEmptyState(msg = "Select a project to view secrets") {
  document.getElementById("secrets-list").innerHTML = `
    <div class="empty-state"><p>${escapeHtml(msg)}</p></div>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
