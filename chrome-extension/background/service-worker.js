const API_BASE = "http://127.0.0.1:8900/api/v1";

async function getToken() {
  const { achilles_token } = await chrome.storage.local.get("achilles_token");
  return achilles_token;
}

async function apiRequest(path, options = {}) {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.local.remove("achilles_token");
      throw new Error("Unauthorized");
    }
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) =>
    sendResponse({ error: err.message })
  );
  return true; // async response
});

async function handleMessage(message) {
  switch (message.type) {
    case "LOGIN":
      const auth = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: message.username,
          password: message.password,
        }),
      });
      await chrome.storage.local.set({ achilles_token: auth.access_token });
      return { success: true };

    case "CHECK_AUTH":
      const token = await getToken();
      return { authenticated: !!token };

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

    case "LOGOUT":
      await chrome.storage.local.remove("achilles_token");
      return { success: true };

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}
