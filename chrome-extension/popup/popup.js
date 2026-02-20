let currentProject = null;
let currentEnv = "development";
let revealedSecrets = {};

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await checkHealth();
  await checkAuth();
  setupEventListeners();
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

// Auth Check
async function checkAuth() {
  const resp = await chrome.runtime.sendMessage({ type: "CHECK_AUTH" });
  if (resp.authenticated) {
    showMainView();
  } else {
    showLoginView();
  }
}

function showLoginView() {
  document.getElementById("login-view").style.display = "block";
  document.getElementById("main-view").style.display = "none";
}

function showMainView() {
  document.getElementById("login-view").style.display = "none";
  document.getElementById("main-view").style.display = "flex";
  document.getElementById("main-view").style.flexDirection = "column";
  document.getElementById("main-view").style.flex = "1";
  loadProjects();
}

// Event Listeners
function setupEventListeners() {
  // Login
  document.getElementById("login-btn").addEventListener("click", handleLogin);
  document.getElementById("password").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ type: "LOGOUT" });
    showLoginView();
  });

  // Open App
  document.getElementById("open-app").addEventListener("click", () => {
    chrome.tabs.create({ url: "http://127.0.0.1:8900" });
  });

  // Project select
  document.getElementById("project-select").addEventListener("change", (e) => {
    const id = parseInt(e.target.value);
    currentProject = id || null;
    if (currentProject) loadSecrets();
    else showEmptyState();
  });

  // Environment tabs
  document.querySelectorAll(".env-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".env-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentEnv = tab.dataset.env;
      if (currentProject) loadSecrets();
    });
  });

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    filterSecrets(e.target.value);
  });
}

// Login
async function handleLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorEl = document.getElementById("login-error");
  const btn = document.getElementById("login-btn");

  if (!username || !password) return;

  btn.disabled = true;
  errorEl.style.display = "none";

  try {
    const resp = await chrome.runtime.sendMessage({
      type: "LOGIN",
      username,
      password,
    });
    if (resp.error) throw new Error(resp.error);
    showMainView();
  } catch (err) {
    errorEl.textContent = err.message || "Login failed";
    errorEl.style.display = "block";
  } finally {
    btn.disabled = false;
  }
}

// Load Projects
async function loadProjects() {
  try {
    const projects = await chrome.runtime.sendMessage({ type: "GET_PROJECTS" });
    if (projects.error) return;

    const select = document.getElementById("project-select");
    select.innerHTML = '<option value="">Select project...</option>';
    (Array.isArray(projects) ? projects : []).forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
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
        <div class="secret-meta">v${s.version}${s.description ? " · " + s.description : ""}</div>
      </div>
      <div class="secret-actions">
        <button class="action-btn" data-action="reveal" data-key="${s.key}" title="Reveal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="action-btn" data-action="copy" data-key="${s.key}" title="Copy">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
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
