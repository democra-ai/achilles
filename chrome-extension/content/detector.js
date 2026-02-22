/**
 * Achilles Vault — Content Script
 *
 * 1. Scans visible text AND input/textarea values for API-key-shaped strings.
 * 2. Reports findings to the background service worker (badge count + storage).
 * 3. Draws a small inline indicator next to each detected token.
 * 4. Provides a "fill picker" overlay when the user right-clicks an <input>/<textarea>.
 */

(() => {
  "use strict";
  if (window.__achillesDetectorLoaded) return;
  window.__achillesDetectorLoaded = true;

  // ── Pattern catalogue ──────────────────────────────────────────────
  const PATTERNS = [
    { name: "OpenAI",         re: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
    { name: "OpenAI Proj",    re: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g },
    { name: "Anthropic",      re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g },
    { name: "AWS Access",     re: /\bAKIA[0-9A-Z]{16}\b/g },
    { name: "AWS Secret",     re: /\b[A-Za-z0-9/+=]{40}\b/g },
    { name: "GitHub PAT",     re: /\bghp_[A-Za-z0-9]{36,}\b/g },
    { name: "GitHub OAuth",   re: /\bgho_[A-Za-z0-9]{36,}\b/g },
    { name: "GitHub App",     re: /\bghs_[A-Za-z0-9]{36,}\b/g },
    { name: "GitHub Fine",    re: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/g },
    { name: "GitLab",         re: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
    { name: "Stripe Live",    re: /\bsk_live_[A-Za-z0-9]{24,}\b/g },
    { name: "Stripe Test",    re: /\bsk_test_[A-Za-z0-9]{24,}\b/g },
    { name: "Stripe PK",      re: /\bpk_live_[A-Za-z0-9]{24,}\b/g },
    { name: "Slack Bot",      re: /\bxoxb-[A-Za-z0-9-]{24,}\b/g },
    { name: "Slack User",     re: /\bxoxp-[A-Za-z0-9-]{24,}\b/g },
    { name: "Twilio",         re: /\bSK[0-9a-f]{32}\b/g },
    { name: "SendGrid",       re: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g },
    { name: "Mailgun",        re: /\bkey-[A-Za-z0-9]{32,}\b/g },
    { name: "NPM Token",     re: /\bnpm_[A-Za-z0-9]{36}\b/g },
    { name: "PyPI Token",    re: /\bpypi-[A-Za-z0-9_-]{40,}\b/g },
    { name: "Heroku",         re: /\bHRKU-[A-Za-z0-9_-]{30,}\b/g },
    { name: "Google API",     re: /\bAIza[A-Za-z0-9_-]{35}\b/g },
    { name: "HuggingFace",   re: /\bhf_[A-Za-z0-9]{30,}\b/g },
    { name: "Supabase",      re: /\bsbp_[A-Za-z0-9]{30,}\b/g },
    { name: "Vercel",         re: /\bvercel_[A-Za-z0-9_-]{20,}\b/g },
    { name: "Groq",           re: /\bgsk_[A-Za-z0-9]{40,}\b/g },
    { name: "Mistral",        re: /\b[A-Za-z0-9]{32}\b/g, minContext: true },
    { name: "Together AI",    re: /\b[a-f0-9]{64}\b/g, minContext: true },
    { name: "Replicate",     re: /\br8_[A-Za-z0-9]{37,}\b/g },
    { name: "Cohere",         re: /\b[A-Za-z0-9]{40}\b/g, minContext: true },
    { name: "Firebase",       re: /\bAAAA[A-Za-z0-9_-]{100,}\b/g },
    { name: "Discord Bot",   re: /\b[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b/g },
  ];

  // Patterns that need surrounding context (class/id/label containing "key", "token", "secret", etc.)
  const CONTEXT_KEYWORDS = /api.?key|token|secret|password|credential|auth/i;

  // Split patterns: specific (always scan) vs context-dependent
  const SPECIFIC = PATTERNS.filter((p) => !p.minContext);
  const CONTEXTUAL = PATTERNS.filter((p) => p.minContext);

  // Track what we already detected so we don't duplicate.
  const seen = new Set();
  const detected = []; // { value, type, url, timestamp }

  // ── Scanning ───────────────────────────────────────────────────────

  function extractFromText(text, hasContext) {
    const hits = [];
    for (const pat of SPECIFIC) {
      for (const m of text.matchAll(pat.re)) {
        if (!seen.has(m[0])) {
          seen.add(m[0]);
          hits.push({ value: m[0], type: pat.name });
        }
      }
    }
    // Only run contextual patterns if surrounding context suggests secrets
    if (hasContext) {
      for (const pat of CONTEXTUAL) {
        for (const m of text.matchAll(pat.re)) {
          if (!seen.has(m[0])) {
            seen.add(m[0]);
            hits.push({ value: m[0], type: pat.name });
          }
        }
      }
    }
    return hits;
  }

  function hasKeyContext(el) {
    if (!el) return false;
    const check = (s) => s && CONTEXT_KEYWORDS.test(s);
    // Check element and parent attributes
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (
        check(node.className) ||
        check(node.id) ||
        check(node.getAttribute?.("aria-label")) ||
        check(node.getAttribute?.("placeholder")) ||
        check(node.getAttribute?.("name")) ||
        check(node.getAttribute?.("data-testid"))
      ) {
        return true;
      }
      // Check sibling labels
      const prev = node.previousElementSibling;
      if (prev && check(prev.textContent)) return true;
    }
    return false;
  }

  function scanNode(root) {
    const newFinds = [];

    // 1. Scan text nodes
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (tw.nextNode()) {
      const text = tw.currentValue;
      if (!text || text.length < 20) continue;
      const context = hasKeyContext(tw.currentNode.parentElement);
      const hits = extractFromText(text, context);
      for (const hit of hits) {
        hit.url = location.href;
        hit.timestamp = Date.now();
        newFinds.push(hit);
      }
    }

    // 2. Scan input/textarea values (API keys are often shown in form fields)
    const inputs = root.querySelectorAll
      ? root.querySelectorAll('input[type="text"], input[type="password"], input:not([type]), textarea, code, pre')
      : [];
    for (const el of inputs) {
      const val = el.value || el.textContent || "";
      if (val.length < 16) continue;
      const context = hasKeyContext(el);
      const hits = extractFromText(val, context);
      for (const hit of hits) {
        hit.url = location.href;
        hit.timestamp = Date.now();
        newFinds.push(hit);
      }
    }

    return newFinds;
  }

  function pushFindings(findings) {
    if (findings.length === 0) return;
    detected.push(...findings);
    chrome.runtime.sendMessage({
      type: "DETECTED_SECRETS",
      secrets: findings,
    });
  }

  // Initial scan
  function initialScan() {
    const findings = scanNode(document.body);
    pushFindings(findings);
  }

  // Periodic re-scan for dynamically rendered content (React/Vue SPAs)
  let rescanTimer = null;
  function scheduleRescan() {
    if (rescanTimer) return;
    rescanTimer = setTimeout(() => {
      rescanTimer = null;
      const findings = scanNode(document.body);
      pushFindings(findings);
    }, 2000);
  }

  // Observe DOM mutations for dynamically added content
  const observer = new MutationObserver((mutations) => {
    const newFinds = [];
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          newFinds.push(...scanNode(node));
        } else if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.length >= 20) {
          const context = hasKeyContext(node.parentElement);
          const hits = extractFromText(node.textContent, context);
          for (const hit of hits) {
            hit.url = location.href;
            hit.timestamp = Date.now();
            newFinds.push(hit);
          }
        }
      }
    }
    pushFindings(newFinds);
    // Schedule a delayed re-scan for SPA content that renders after DOM mutations
    scheduleRescan();
  });

  // ── Inline indicators ──────────────────────────────────────────────

  function addIndicators() {
    // Walk all text nodes and wrap detected tokens with a highlight span
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (tw.nextNode()) textNodes.push(tw.currentNode);

    for (const tNode of textNodes) {
      const text = tNode.textContent;
      if (!text || text.length < 20) continue;
      // Check if any detected value is in this text
      const matchedDetect = detected.find((d) => text.includes(d.value));
      if (!matchedDetect) continue;
      // Don't re-process nodes we already marked
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

  // ── Fill picker (for right-click / context menu on inputs) ─────────

  let fillOverlay = null;

  function createFillOverlay(inputEl) {
    removeFillOverlay();

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

    // Position near the input
    const rect = inputEl.getBoundingClientRect();
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
              if (valResp && valResp.value) {
                // Set the value natively so frameworks detect the change
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype, "value"
                )?.set || Object.getOwnPropertyDescriptor(
                  window.HTMLTextAreaElement.prototype, "value"
                )?.set;
                if (nativeInputValueSetter) {
                  nativeInputValueSetter.call(inputEl, valResp.value);
                } else {
                  inputEl.value = valResp.value;
                }
                inputEl.dispatchEvent(new Event("input", { bubbles: true }));
                inputEl.dispatchEvent(new Event("change", { bubbles: true }));
              }
              removeFillOverlay();
            }
          );
        });
        list.appendChild(item);
      }
    });
  }

  function removeFillOverlay() {
    if (fillOverlay) {
      fillOverlay.remove();
      fillOverlay = null;
    }
  }

  // Close overlay on outside click
  document.addEventListener("click", (e) => {
    if (fillOverlay && !fillOverlay.contains(e.target)) {
      removeFillOverlay();
    }
  });

  // Listen for context-menu fill request from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "FILL_FROM_VAULT") {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        createFillOverlay(active);
      }
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Boot ───────────────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialScan();
      addIndicators();
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
  } else {
    initialScan();
    addIndicators();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
})();
