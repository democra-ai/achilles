/**
 * Rules Loader — loads and compiles rules from rules.json
 *
 * Used by the background service worker to serve compiled rules
 * to content scripts via messaging.
 */

let _compiledRules = null;
let _rawRules = null;

/**
 * Load rules.json and compile regex patterns.
 * Caches result after first load.
 * @returns {Promise<Array>} Compiled rules with RegExp objects
 */
export async function loadRules() {
  if (_compiledRules) return _compiledRules;

  const url = chrome.runtime.getURL("rules/rules.json");
  const resp = await fetch(url);
  const data = await resp.json();
  _rawRules = data;

  _compiledRules = data.rules.map((rule) => ({
    ...rule,
    re: new RegExp(rule.pattern, rule.flags || "g"),
    minContext: !!rule.contextRequired,
  }));

  return _compiledRules;
}

/**
 * Get raw rules data (JSON-serializable, for sending to content scripts).
 * @returns {Promise<Object>} Raw rules.json data
 */
export async function getRawRules() {
  if (!_rawRules) await loadRules();
  return _rawRules;
}

/**
 * Get rule summary grouped by platform.
 * @returns {Promise<Object>} { platform: [{ id, name, severity, description }] }
 */
export async function getRuleSummary() {
  const rules = await loadRules();
  const summary = {};
  for (const rule of rules) {
    const platform = rule.platform || "Other";
    if (!summary[platform]) summary[platform] = [];
    summary[platform].push({
      id: rule.id,
      name: rule.name,
      severity: rule.severity,
      description: rule.description,
      reference: rule.reference || null,
    });
  }
  return summary;
}

/**
 * Serialize compiled rules for content script consumption.
 * Content scripts can't receive RegExp objects via messaging,
 * so we send the raw pattern strings and let them recompile.
 * @returns {Promise<Array>} Serializable rule objects
 */
export async function getSerializableRules() {
  if (!_rawRules) await loadRules();
  return _rawRules.rules.map((rule) => ({
    id: rule.id,
    name: rule.name,
    platform: rule.platform,
    pattern: rule.pattern,
    flags: rule.flags || "g",
    severity: rule.severity,
    description: rule.description,
    contextRequired: !!rule.contextRequired,
    reference: rule.reference || null,
  }));
}
