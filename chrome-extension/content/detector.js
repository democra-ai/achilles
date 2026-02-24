/**
 * Achilles Vault — Content Script
 *
 * 1. Scans visible text AND input/textarea values for API-key-shaped strings.
 * 2. Reports findings to the background service worker (badge count + storage).
 * 3. Draws a small inline indicator next to each detected token.
 * 4. Provides "fill from vault" actions for secret fields.
 */

(() => {
  "use strict";
  if (window.__achillesDetectorLoaded) return;
  window.__achillesDetectorLoaded = true;

  // Pattern catalogue
  const PATTERNS = [
    { name: "OpenAI", re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
    { name: "OpenAI Proj", re: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g },
    { name: "Anthropic", re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
    { name: "AWS Access", re: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: "AWS Secret", re: /\b[A-Za-z0-9/+=]{40}\b/g },
    { name: "GitHub PAT", re: /\bghp_[A-Za-z0-9]{36,}\b/g },
    { name: "GitHub OAuth", re: /\bgho_[A-Za-z0-9]{36,}\b/g },
    { name: "GitHub App", re: /\bghs_[A-Za-z0-9]{36,}\b/g },
    { name: "GitHub Fine", re: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/g },
    { name: "GitLab", re: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
    { name: "Stripe Live", re: /\bsk_live_[A-Za-z0-9]{24,}\b/g },
    { name: "Stripe Test", re: /\bsk_test_[A-Za-z0-9]{24,}\b/g },
    { name: "Stripe PK", re: /\bpk_live_[A-Za-z0-9]{24,}\b/g },
    { name: "Slack Bot", re: /\bxoxb-[A-Za-z0-9-]{24,}\b/g },
    { name: "Slack User", re: /\bxoxp-[A-Za-z0-9-]{24,}\b/g },
    { name: "Twilio", re: /\bSK[0-9a-f]{32}\b/g },
    { name: "SendGrid", re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
    { name: "Mailgun", re: /\bkey-[A-Za-z0-9]{32,}\b/g },
    { name: "NPM Token", re: /\bnpm_[A-Za-z0-9]{36}\b/g },
    { name: "PyPI Token", re: /\bpypi-[A-Za-z0-9_-]{40,}\b/g },
    { name: "Heroku", re: /\bHRKU-[A-Za-z0-9_-]{30,}\b/g },
    { name: "Google API", re: /\bAIza[A-Za-z0-9_-]{35}\b/g },
    { name: "HuggingFace", re: /\bhf_[A-Za-z0-9]{30,}\b/g },
    { name: "Supabase", re: /\bsbp_[A-Za-z0-9]{30,}\b/g },
    { name: "Vercel", re: /\bvercel_[A-Za-z0-9_-]{20,}\b/g },
    { name: "Groq", re: /\bgsk_[A-Za-z0-9]{40,}\b/g },
    { name: "Replicate", re: /\br8_[A-Za-z0-9]{37,}\b/g },
    { name: "Firebase", re: /\bAAAA[A-Za-z0-9_-]{100,}\b/g },
    { name: "Discord Bot", re: /\b[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b/g },
    { name: "JWT", re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, minContext: true },
  ];

  const DETECTION_KEYWORDS = /api[ _-]?key|access[ _-]?key|token|secret|password|credential|auth|env(?:ironment)?(?:[_\s-]?(?:var|variable|vars))?|环境变量|密钥|令牌/i;
  const FILL_CONTEXT_KEYWORDS = /api[ _-]?key|access[ _-]?key|token|secret|credential|env(?:ironment)?(?:[_\s-]?(?:var|variable|vars))?|环境变量|密钥|令牌/i;
  const FILL_ALLOWED_PAGES = [
    { host: "github.com", path: /\/settings\/(personal-access-tokens|tokens|secrets|variables)|\/[^/]+\/[^/]+\/settings\/(secrets|variables)\/actions/i },
    { host: "gitlab.com", path: /\/-\/user_settings\/personal_access_tokens|\/[^/]+\/[^/]+\/-\/settings\/ci_cd/i },
    { host: "huggingface.co", path: /\/settings\/tokens/i },
    { host: "platform.openai.com", path: /\/api-keys|\/settings\/organization\/api-keys|\/settings\/project.*api-keys/i },
    { host: "platform.claude.com", path: /\/settings\/keys/i },
    { host: "console.anthropic.com", path: /\/settings\/keys/i },
    { host: "app.netlify.com", path: /\/.*\/(configuration\/env|settings\/env)/i },
    { host: "vercel.com", path: /\/.*\/settings\/environment-variables/i },
    { host: "dash.cloudflare.com", path: /\/profile\/api-tokens|\/[^/]+\/api-tokens/i },
    { host: "pypi.org", path: /\/manage\/account\/token/i },
    { host: "www.npmjs.com", path: /\/settings\/.*\/tokens|\/settings\/tokens/i },
    { host: "digitalocean.com", path: /\/settings\/api\/tokens|\/account\/api\/tokens/i },
  ];
  const COMMON_TOKEN_SCOPES = [
    "repo", "read:user", "user:email", "workflow", "admin:org", "gist", "read:org",
    "write:packages", "read:packages", "delete:packages", "contents:read", "contents:write",
    "pull_requests:write", "metadata:read",
  ];
  const EDITABLE_SELECTOR = 'input, textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';
  const VALUE_SCAN_SELECTOR = 'input, textarea, code, pre, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"]';
  const SKIP_TEXT_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "IFRAME"]);

  const SPECIFIC = PATTERNS.filter((p) => !p.minContext);
  const CONTEXTUAL = PATTERNS.filter((p) => p.minContext);

  const seen = new Set();
  const detected = [];
  let fillOverlay = null;
  let importOverlay = null;
  let fillHint = null;
  let fillHintTarget = null;
  let lastFocusedEditable = null;
  let lastContextMenuEditable = null;
  let rescanTimer = null;
  let indicatorTimer = null;

  function extractFromText(text, hasContext, sourceEl = null, sourceText = "") {
    const source = String(text || "");
    if (!hasContext) return [];
    const hits = [];

    for (const pat of SPECIFIC) {
      for (const m of source.matchAll(pat.re)) {
        const token = m[0];
        if (!seen.has(token)) {
          seen.add(token);
          hits.push(enrichHit({ value: token, type: pat.name }, sourceEl, sourceText || source));
        }
      }
    }

    for (const pat of CONTEXTUAL) {
      for (const m of source.matchAll(pat.re)) {
        const token = m[0];
        if (!isValidContextualMatch(pat, token)) continue;
        if (!seen.has(token)) {
          seen.add(token);
          hits.push(enrichHit({ value: token, type: pat.name }, sourceEl, sourceText || source));
        }
      }
    }
    return hits;
  }

  function isValidContextualMatch(pattern, token) {
    if (!token) return false;
    if (/^(?:true|false|null|undefined)$/i.test(token)) return false;
    if (/^https?:\/\//i.test(token)) return false;
    return true;
  }

  function hasKeyContext(el, matcher = DETECTION_KEYWORDS) {
    if (!el) return false;
    const check = (s) => s && matcher.test(String(s));

    if (el.id) {
      const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(el.id) : el.id.replace(/"/g, '\\"');
      const explicitLabel = document.querySelector(`label[for="${escaped}"]`);
      if (explicitLabel && check(explicitLabel.textContent)) return true;
    }

    const wrappedLabel = el.closest?.("label");
    if (wrappedLabel && check(wrappedLabel.textContent)) return true;

    for (let node = el; node; node = node.parentElement) {
      if (
        check(node.className) ||
        check(node.id) ||
        check(node.getAttribute?.("type")) ||
        check(node.getAttribute?.("aria-label")) ||
        check(node.getAttribute?.("placeholder")) ||
        check(node.getAttribute?.("name")) ||
        check(node.getAttribute?.("autocomplete")) ||
        check(node.getAttribute?.("title")) ||
        check(node.getAttribute?.("data-testid"))
      ) {
        return true;
      }

      const prev = node.previousElementSibling;
      if (prev && check(prev.textContent)) return true;

      if (node === document.body) break;
    }
    return false;
  }

  function isSkippableTextNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    return SKIP_TEXT_TAGS.has(parent.tagName);
  }

  function textHasKeywordContext(text, matcher = DETECTION_KEYWORDS) {
    if (!text) return false;
    return matcher.test(String(text));
  }

  function getElementValue(el) {
    if (!el) return "";
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el.value || "";
    }
    if (el.isContentEditable) {
      return el.textContent || "";
    }
    return el.textContent || "";
  }

  function isEditable(el) {
    if (!(el instanceof Element)) return false;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
    return el.isContentEditable === true;
  }

  function isFillable(el) {
    if (!isEditable(el)) return false;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el.disabled || el.readOnly) return false;
      if (el.type === "hidden") return false;
    }
    return true;
  }

  function isVisible(el) {
    if (!(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  }

  function getEditableTarget(node) {
    if (!node) return null;
    const el = node instanceof Element ? node : node.parentElement;
    if (!el) return null;
    if (isEditable(el)) return el;
    return el.closest?.(EDITABLE_SELECTOR) || null;
  }

  function eventNode(event) {
    if (typeof event.composedPath === "function") {
      const path = event.composedPath();
      if (path && path.length > 0) return path[0];
    }
    return event.target;
  }

  function normalizeHost(host) {
    return String(host || "").toLowerCase().replace(/^www\./, "");
  }

  function isAllowedFillPage(url = location) {
    const host = normalizeHost(url.hostname);
    const path = `${url.pathname || ""}${url.search || ""}`;
    return FILL_ALLOWED_PAGES.some((rule) => {
      const ruleHost = normalizeHost(rule.host);
      const hostMatched = host === ruleHost || host.endsWith(`.${ruleHost}`);
      return hostMatched && rule.path.test(path);
    });
  }

  function inferSourceFromPattern(typeName) {
    const t = String(typeName || "").toLowerCase();
    if (t.includes("github")) return "github";
    if (t.includes("gitlab")) return "gitlab";
    if (t.includes("openai")) return "openai";
    if (t.includes("anthropic")) return "anthropic";
    if (t.includes("stripe")) return "stripe";
    if (t.includes("huggingface")) return "huggingface";
    if (t.includes("aws")) return "aws";
    if (t.includes("npm")) return "npm";
    if (t.includes("pypi")) return "pypi";
    if (t.includes("vercel")) return "vercel";
    if (t.includes("supabase")) return "supabase";
    return normalizeHost(location.hostname);
  }

  function inferCategoryFromPattern(typeName) {
    const t = String(typeName || "").toLowerCase();
    if (t.includes("token") || t.includes("pat") || t === "jwt") return "token";
    if (t.includes("api") || t.includes("access")) return "api_key";
    return "secret";
  }

  function sanitizeKeyName(name) {
    const out = String(name || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return out || "";
  }

  function parseEnvKeyNearToken(text, token) {
    if (!text || !token) return "";
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = String(text).match(new RegExp(`\\b([A-Z][A-Z0-9_]{2,})\\b\\s*[:=]\\s*["'\`]?${escaped}`));
    return m ? m[1] : "";
  }

  function findGitHubTokenName() {
    const candidates = [
      'input[name="user_programmatic_access_name"]',
      'input[id*="programmatic_access_name"]',
      'input[name*="token_name"]',
      'input[aria-label*="Token name"]',
      'input[placeholder*="Token name"]',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el && el.value && el.value.trim()) return el.value.trim();
    }
    return "";
  }

  function findGitHubScopes() {
    const scopes = new Set();

    const checked = document.querySelectorAll('input[type="checkbox"]:checked');
    for (const cb of checked) {
      const label = cb.closest("label");
      const text = `${cb.name || ""} ${cb.id || ""} ${label?.textContent || ""}`;
      for (const s of COMMON_TOKEN_SCOPES) {
        if (new RegExp(`(^|\\W)${s.replace(/[:]/g, "\\:")}(\\W|$)`, "i").test(text)) {
          scopes.add(s);
        }
      }
    }

    if (scopes.size > 0) return Array.from(scopes);
    const body = (document.body?.innerText || "").slice(0, 12000);
    for (const s of COMMON_TOKEN_SCOPES) {
      if (new RegExp(`(^|\\W)${s.replace(/[:]/g, "\\:")}(\\W|$)`, "i").test(body)) {
        scopes.add(s);
      }
    }
    return Array.from(scopes);
  }

  function enrichHit(hit, sourceEl, sourceText) {
    const enriched = { ...hit };
    enriched.source = inferSourceFromPattern(hit.type);
    enriched.category = inferCategoryFromPattern(hit.type);
    enriched.tags = [`source:${enriched.source}`];

    const envKey = parseEnvKeyNearToken(sourceText, hit.value);
    if (envKey) {
      enriched.suggestedKey = envKey;
      if (!enriched.tags.includes("kind:env_var")) enriched.tags.push("kind:env_var");
    }

    if (normalizeHost(location.hostname) === "github.com" && String(hit.type || "").toLowerCase().includes("github")) {
      const tokenName = findGitHubTokenName();
      const permissions = findGitHubScopes();
      if (tokenName) {
        enriched.tokenName = tokenName;
        enriched.suggestedKey = sanitizeKeyName(tokenName) || enriched.suggestedKey;
      }
      if (permissions.length > 0) {
        enriched.permissions = permissions;
        for (const p of permissions.slice(0, 8)) {
          enriched.tags.push(`scope:${p}`);
        }
      }
      enriched.category = "token";
    }

    if (!enriched.suggestedKey) {
      const byType = sanitizeKeyName(String(hit.type || ""));
      if (byType) enriched.suggestedKey = `${byType}_VALUE`;
    }

    return enriched;
  }

  function sendMessageAsync(payload) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(payload, (resp) => resolve(resp));
    });
  }

  function normalizeSelectedSecret(text) {
    if (!text) return "";
    let value = String(text).trim();
    if (!value) return "";

    const assignmentMatch = value.match(/^[A-Za-z_][A-Za-z0-9_]*\s*[:=]\s*([\s\S]+)$/);
    if (assignmentMatch) {
      value = assignmentMatch[1].trim();
    }

    value = value.replace(/^\s*["'`]+/, "").replace(/["'`]+\s*$/, "").trim();
    return value;
  }

  function toFinding(hit) {
    return {
      ...hit,
      url: location.href,
      timestamp: Date.now(),
    };
  }

  function getAllRoots(base = document) {
    const roots = [];
    const queue = [];

    if (base.body) queue.push(base.body);
    else queue.push(base);

    while (queue.length > 0) {
      const root = queue.shift();
      if (!root) continue;
      roots.push(root);

      const elements = root.querySelectorAll ? root.querySelectorAll("*") : [];
      for (const el of elements) {
        if (el.shadowRoot) {
          queue.push(el.shadowRoot);
        }
      }
    }

    return roots;
  }

  function scanNode(root) {
    const newFinds = [];

    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (tw.nextNode()) {
      const node = tw.currentNode;
      if (isSkippableTextNode(node)) continue;
      const text = node.textContent;
      if (!text || text.length < 20) continue;
      const context = hasKeyContext(node.parentElement) || textHasKeywordContext(text);
      const hits = extractFromText(text, context, node.parentElement, text).map(toFinding);
      if (hits.length > 0) {
        newFinds.push(...hits);
      }
    }

    const inputs = root.querySelectorAll
      ? Array.from(root.querySelectorAll(VALUE_SCAN_SELECTOR))
      : [];

    if ((isEditable(root) || root.tagName === "CODE" || root.tagName === "PRE") && !inputs.includes(root)) {
      inputs.push(root);
    }

    for (const el of inputs) {
      const val = getElementValue(el);
      if (val.length < 16) continue;
      const context = hasKeyContext(el);
      const hits = extractFromText(val, context, el, val).map(toFinding);
      if (hits.length > 0) {
        newFinds.push(...hits);
      }
    }

    return newFinds;
  }

  function scanAllRoots() {
    const allFinds = [];
    const roots = getAllRoots(document);
    for (const root of roots) {
      allFinds.push(...scanNode(root));
    }
    return allFinds;
  }

  function pushFindings(findings) {
    if (findings.length === 0) return;
    detected.push(...findings);
    chrome.runtime.sendMessage({
      type: "DETECTED_SECRETS",
      secrets: findings,
    });
    scheduleIndicatorRefresh();
  }

  function initialScan() {
    const findings = scanAllRoots();
    pushFindings(findings);
    updateFillHint();
  }

  function scheduleRescan() {
    if (rescanTimer) return;
    rescanTimer = setTimeout(() => {
      rescanTimer = null;
      const findings = scanAllRoots();
      pushFindings(findings);
      updateFillHint();
    }, 2000);
  }

  function scheduleIndicatorRefresh() {
    if (indicatorTimer) return;
    indicatorTimer = setTimeout(() => {
      indicatorTimer = null;
      addIndicators();
    }, 120);
  }

  const observer = new MutationObserver((mutations) => {
    const newFinds = [];

    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          newFinds.push(...scanNode(node));
          if (node.shadowRoot) {
            newFinds.push(...scanNode(node.shadowRoot));
          }
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.length >= 20) {
          const context = hasKeyContext(node.parentElement) || textHasKeywordContext(node.textContent);
          const hits = extractFromText(node.textContent, context, node.parentElement, node.textContent).map(toFinding);
          if (hits.length > 0) {
            newFinds.push(...hits);
          }
        }
      }

      if (m.type === "characterData" && m.target?.textContent?.length >= 20) {
        const context = hasKeyContext(m.target.parentElement) || textHasKeywordContext(m.target.textContent);
        const hits = extractFromText(m.target.textContent, context, m.target.parentElement, m.target.textContent).map(toFinding);
        if (hits.length > 0) {
          newFinds.push(...hits);
        }
      }

      if (m.type === "attributes" && m.target) {
        newFinds.push(...scanNode(m.target));
      }
    }

    pushFindings(newFinds);
    updateFillHint();
    scheduleRescan();
  });

  function addIndicators() {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (tw.nextNode()) textNodes.push(tw.currentNode);

    for (const tNode of textNodes) {
      const text = tNode.textContent;
      if (!text || text.length < 20) continue;
      if (isSkippableTextNode(tNode)) continue;
      const matchedDetect = detected.find((d) => text.includes(d.value));
      if (!matchedDetect) continue;
      if (tNode.parentElement?.classList?.contains("achilles-detected")) continue;

      const idx = text.indexOf(matchedDetect.value);
      if (idx === -1) continue;

      const before = text.slice(0, idx);
      const match = matchedDetect.value;
      const after = text.slice(idx + match.length);

      const span = document.createElement("span");
      span.className = "achilles-detected";
      span.title = `Achilles Vault: ${matchedDetect.type} key detected`;
      span.textContent = match;

      const badge = document.createElement("span");
      badge.className = "achilles-badge";
      badge.textContent = "vault";
      badge.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        chrome.runtime.sendMessage({
          type: "IMPORT_SECRET",
          secret: matchedDetect,
        });
      });
      span.appendChild(badge);

      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      if (after) frag.appendChild(document.createTextNode(after));
      tNode.parentNode.replaceChild(frag, tNode);
    }
  }

  function resolveFillTarget() {
    if (lastContextMenuEditable && lastContextMenuEditable.isConnected) return lastContextMenuEditable;
    const active = getEditableTarget(document.activeElement);
    if (active && active.isConnected) return active;
    if (lastFocusedEditable && lastFocusedEditable.isConnected) return lastFocusedEditable;
    return null;
  }

  function createFillOverlay(targetEl) {
    if (!targetEl) return;
    removeFillOverlay();
    removeFillHint();

    fillOverlay = document.createElement("div");
    fillOverlay.className = "achilles-fill-overlay";
    fillOverlay.innerHTML = `
      <div class="achilles-fill-header">
        <span>Achilles Vault — Fill Secret</span>
        <button class="achilles-fill-close">&times;</button>
      </div>
      <div class="achilles-fill-loading">Loading secrets...</div>
      <div class="achilles-fill-list" style="display:none"></div>
    `;

    const rect = targetEl.getBoundingClientRect();
    fillOverlay.style.position = "fixed";
    fillOverlay.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - 260)}px`;
    fillOverlay.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
    fillOverlay.style.zIndex = "2147483647";

    document.body.appendChild(fillOverlay);

    fillOverlay.querySelector(".achilles-fill-close").addEventListener("click", removeFillOverlay);

    // Load secrets from background
    chrome.runtime.sendMessage({ type: "GET_FILL_SECRETS" }, (resp) => {
      if (!fillOverlay) return;
      const loading = fillOverlay.querySelector(".achilles-fill-loading");
      const list = fillOverlay.querySelector(".achilles-fill-list");

      if (!resp || resp.error || !resp.secrets || resp.secrets.length === 0) {
        loading.textContent = resp?.error || "No secrets available";
        return;
      }

      loading.style.display = "none";
      list.style.display = "block";

      for (const s of resp.secrets) {
        const item = document.createElement("button");
        item.className = "achilles-fill-item";
        item.innerHTML = `<span class="achilles-fill-key">${escapeHtml(s.key)}</span><span class="achilles-fill-env">${escapeHtml(s.env)}</span>`;
        item.addEventListener("click", () => {
          chrome.runtime.sendMessage(
            {
              type: "GET_SECRET_VALUE",
              projectId: s.projectId,
              env: s.env,
              key: s.key,
            },
            (valResp) => {
              if (valResp && Object.prototype.hasOwnProperty.call(valResp, "value")) {
                applyValueToElement(targetEl, valResp.value ?? "");
              }
              removeFillOverlay();
              updateFillHint();
            }
          );
        });
        list.appendChild(item);
      }
    });
  }

  async function createImportOverlay(selectedRawText) {
    const selectedValue = normalizeSelectedSecret(selectedRawText);
    if (!selectedValue) return;

    removeFillOverlay();
    removeImportOverlay();

    importOverlay = document.createElement("div");
    importOverlay.className = "achilles-import-overlay";
    importOverlay.innerHTML = `
      <div class="achilles-import-header">
        <span>Achilles Vault — Import Selection</span>
        <button class="achilles-import-close">&times;</button>
      </div>
      <div class="achilles-import-body">
        <label class="achilles-import-label">Selected value</label>
        <textarea class="achilles-import-value" spellcheck="false"></textarea>

        <div class="achilles-import-grid">
          <div class="achilles-import-col">
            <label class="achilles-import-label">Project</label>
            <select class="achilles-import-project"></select>
          </div>
          <div class="achilles-import-col">
            <label class="achilles-import-label">Environment</label>
            <select class="achilles-import-env">
              <option value="development">development</option>
              <option value="staging">staging</option>
              <option value="production">production</option>
            </select>
          </div>
        </div>

        <div class="achilles-import-grid">
          <div class="achilles-import-col">
            <label class="achilles-import-label">Category</label>
            <select class="achilles-import-category">
              <option value="token">token</option>
              <option value="api_key">api_key</option>
              <option value="env_var">env_var</option>
              <option value="secret">secret</option>
            </select>
          </div>
          <div class="achilles-import-col">
            <label class="achilles-import-label">Tags (comma separated)</label>
            <input class="achilles-import-tags" type="text" placeholder="source:github, scope:repo" />
          </div>
        </div>

        <label class="achilles-import-label">Key name (optional)</label>
        <input class="achilles-import-key" type="text" placeholder="AUTO_GENERATED_KEY" />

        <div class="achilles-import-status"></div>
      </div>
      <div class="achilles-import-actions">
        <button class="achilles-import-btn secondary">Cancel</button>
        <button class="achilles-import-btn primary">Import</button>
      </div>
    `;

    document.body.appendChild(importOverlay);
    const closeBtn = importOverlay.querySelector(".achilles-import-close");
    const cancelBtn = importOverlay.querySelector(".achilles-import-btn.secondary");
    const importBtn = importOverlay.querySelector(".achilles-import-btn.primary");
    const valueEl = importOverlay.querySelector(".achilles-import-value");
    const keyEl = importOverlay.querySelector(".achilles-import-key");
    const projectEl = importOverlay.querySelector(".achilles-import-project");
    const envEl = importOverlay.querySelector(".achilles-import-env");
    const categoryEl = importOverlay.querySelector(".achilles-import-category");
    const tagsEl = importOverlay.querySelector(".achilles-import-tags");
    const statusEl = importOverlay.querySelector(".achilles-import-status");

    valueEl.value = selectedValue;
    valueEl.focus();
    valueEl.setSelectionRange(valueEl.value.length, valueEl.value.length);

    const remove = () => removeImportOverlay();
    closeBtn.addEventListener("click", remove);
    cancelBtn.addEventListener("click", remove);

    statusEl.textContent = "Loading projects...";
    const [projectsResp, prefsResp] = await Promise.all([
      sendMessageAsync({ type: "GET_PROJECTS" }),
      sendMessageAsync({ type: "GET_USER_PREFS" }),
    ]);
    if (!importOverlay) return;

    const projects = Array.isArray(projectsResp) ? projectsResp : [];
    if (projects.length === 0) {
      statusEl.textContent = "No projects available in vault.";
      importBtn.disabled = true;
      return;
    }

    projectEl.innerHTML = projects
      .map((p) => `<option value="${escapeHtml(String(p.id))}">${escapeHtml(p.name)}</option>`)
      .join("");
    const preferredProjectId = prefsResp?.lastProjectId
      ? String(prefsResp.lastProjectId)
      : null;
    const matchedProject = preferredProjectId
      ? projects.find((p) => String(p.id) === preferredProjectId)
      : null;
    projectEl.value = matchedProject ? String(matchedProject.id) : String(projects[0].id);
    const preferredEnv = prefsResp?.lastEnv || "development";
    envEl.value = ["development", "staging", "production"].includes(preferredEnv)
      ? preferredEnv
      : "development";
    if (selectedValue.startsWith("ghp_") || selectedValue.startsWith("github_pat_")) {
      categoryEl.value = "token";
      tagsEl.value = "source:github";
    } else if (selectedValue.startsWith("sk-") || selectedValue.startsWith("AKIA")) {
      categoryEl.value = "api_key";
    } else {
      categoryEl.value = "secret";
    }
    statusEl.textContent = "";

    importBtn.addEventListener("click", async () => {
      const value = normalizeSelectedSecret(valueEl.value);
      if (!value) {
        statusEl.textContent = "Selected value is empty.";
        return;
      }

      const projectId = projectEl.value;
      const env = envEl.value;
      const category = categoryEl.value;
      const key = keyEl.value.trim();
      const tags = tagsEl.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      importBtn.disabled = true;
      importBtn.textContent = "Importing...";
      statusEl.textContent = "";

      await sendMessageAsync({
        type: "SET_USER_PREFS",
        lastProjectId: projectId,
        lastEnv: env,
      });

      const resp = await sendMessageAsync({
        type: "IMPORT_SECRET",
        secret: { value, type: "Manual Selection" },
        projectId,
        env,
        key: key || undefined,
        category,
        tags,
      });

      if (resp?.error) {
        statusEl.textContent = `Import failed: ${resp.error}`;
        importBtn.disabled = false;
        importBtn.textContent = "Import";
        return;
      }

      statusEl.textContent = `Imported as ${resp.key}`;
      setTimeout(() => {
        removeImportOverlay();
      }, 700);
    });
  }

  function applyValueToElement(targetEl, nextValue) {
    try {
      if (targetEl instanceof HTMLInputElement || targetEl instanceof HTMLTextAreaElement) {
        const proto = targetEl instanceof HTMLTextAreaElement
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        if (setter) setter.call(targetEl, nextValue);
        else targetEl.value = nextValue;
      } else if (targetEl.isContentEditable) {
        targetEl.textContent = nextValue;
      } else {
        targetEl.value = nextValue;
      }
    } catch {
      if ("value" in targetEl) targetEl.value = nextValue;
      else targetEl.textContent = nextValue;
    }

    const inputEvt = typeof InputEvent === "function"
      ? new InputEvent("input", { bubbles: true, composed: true, data: nextValue, inputType: "insertText" })
      : new Event("input", { bubbles: true, composed: true });

    targetEl.dispatchEvent(inputEvt);
    targetEl.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
  }

  function updateFillHint() {
    if (fillOverlay) return;

    const target = resolveFillHintTarget();
    if (!target) {
      removeFillHint();
      return;
    }
    showFillHint(target);
  }

  function resolveFillHintTarget() {
    if (lastFocusedEditable && isHintCandidate(lastFocusedEditable)) {
      return lastFocusedEditable;
    }
    const roots = getAllRoots(document);
    for (const root of roots) {
      const candidates = root.querySelectorAll ? root.querySelectorAll(EDITABLE_SELECTOR) : [];
      for (const el of candidates) {
        if (isHintCandidate(el)) return el;
      }
    }
    return null;
  }

  function isHintCandidate(el) {
    if (!el || !el.isConnected) return false;
    if (!isFillable(el)) return false;
    if (!isVisible(el)) return false;
    if (!isAllowedFillPage()) return false;
    if (!hasKeyContext(el, FILL_CONTEXT_KEYWORDS)) return false;
    return getElementValue(el).trim().length === 0;
  }

  function showFillHint(targetEl) {
    fillHintTarget = targetEl;
    if (!fillHint) {
      fillHint = document.createElement("button");
      fillHint.type = "button";
      fillHint.className = "achilles-fill-fab";
      fillHint.textContent = "Fill";
      fillHint.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        createFillOverlay(fillHintTarget);
      });
      document.body.appendChild(fillHint);
    }
    positionFillHint();
  }

  function positionFillHint() {
    if (!fillHint || !fillHintTarget || !fillHintTarget.isConnected) return;
    const rect = fillHintTarget.getBoundingClientRect();
    fillHint.style.position = "fixed";
    fillHint.style.top = `${Math.max(8, rect.top - 10)}px`;
    fillHint.style.left = `${Math.min(window.innerWidth - 62, rect.right - 46)}px`;
    fillHint.style.zIndex = "2147483646";
  }

  function removeFillHint() {
    if (fillHint) {
      fillHint.remove();
      fillHint = null;
    }
    fillHintTarget = null;
  }

  function removeFillOverlay() {
    if (fillOverlay) {
      fillOverlay.remove();
      fillOverlay = null;
    }
  }

  function removeImportOverlay() {
    if (importOverlay) {
      importOverlay.remove();
      importOverlay = null;
    }
  }

  // Close overlay on outside click
  document.addEventListener("click", (e) => {
    if (fillOverlay && !fillOverlay.contains(e.target)) {
      removeFillOverlay();
      updateFillHint();
    }
    if (importOverlay && !importOverlay.contains(e.target)) {
      removeImportOverlay();
    }
  });

  document.addEventListener("contextmenu", (e) => {
    lastContextMenuEditable = getEditableTarget(eventNode(e));
  }, true);

  document.addEventListener("focusin", (e) => {
    const target = getEditableTarget(eventNode(e));
    if (!target) return;
    lastFocusedEditable = target;
    updateFillHint();
  }, true);

  document.addEventListener("input", (e) => {
    if (!fillHintTarget) return;
    const target = getEditableTarget(eventNode(e));
    if (target && target === fillHintTarget) {
      updateFillHint();
    }
  }, true);

  window.addEventListener("scroll", () => {
    positionFillHint();
  }, true);

  window.addEventListener("resize", () => {
    positionFillHint();
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "FILL_FROM_VAULT") {
      const target = resolveFillTarget();
      if (target) {
        createFillOverlay(target);
      }
      return;
    }
    if (message.type === "IMPORT_SELECTED_TEXT") {
      createImportOverlay(message.text || "");
    }
  });

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialScan();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["value", "placeholder", "name", "id", "class", "aria-label", "data-testid", "type"],
      });
    });
  } else {
    initialScan();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["value", "placeholder", "name", "id", "class", "aria-label", "data-testid", "type"],
    });
  }
})();
