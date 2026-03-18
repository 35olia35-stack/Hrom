"use strict";

const EXTRACTION_MESSAGE_TYPE = "EXTRACT_EBAY_LISTING_DATA";
const INSERT_PREMIUM_HTML_MESSAGE_TYPE = "INSERT_PREMIUM_HTML_INTO_LISTING";
const INSERT_TITLE_MESSAGE_TYPE = "INSERT_EBAY_TITLE_INTO_LISTING";
const INSERT_TEXT_DESCRIPTION_MESSAGE_TYPE = "INSERT_EBAY_TEXT_DESCRIPTION_INTO_LISTING";
const POPUP_STATE_STORAGE_KEY = "ebayListingAssistantPopupState";

/*
  Put your real endpoint here if you want the extension to call the same API as the site.
  Example:
  const PREMIUM_API_ENDPOINT = "https://your-domain.com/api/generate";
*/
const PREMIUM_API_ENDPOINT = "";

const THEME_PRESETS = {
  modern: {
    Blue: { primary: "#1f3c88", light: "#eaf1ff", soft: "#f1f5ff", accent: "#1f3c88" },
    Green: { primary: "#166534", light: "#eafaf1", soft: "#f0fdf4", accent: "#166534" },
    "Dark Pink": { primary: "#8b1d5c", light: "#fde8f1", soft: "#fff1f7", accent: "#8b1d5c" }
  },
  seo: {
    Black: { primary: "#111827", light: "#f3f4f6", soft: "#374151", accent: "#111827" },
    Purple: { primary: "#4c1d95", light: "#f5f3ff", soft: "#6d28d9", accent: "#6d28d9" },
    Terracotta: { primary: "#7c2d12", light: "#fff7ed", soft: "#9a3412", accent: "#9a3412" }
  }
};

const DEFAULT_THEME_VARS = {
  classic: { primary: "#1f3c88", light: "#eaf1ff", soft: "#f1f5ff", accent: "#1f3c88" },
  modern: THEME_PRESETS.modern.Blue,
  seo: THEME_PRESETS.seo.Black
};

const CLASSIC_TEMPLATE = `
<div style="max-width:100%; font-family:Arial, Helvetica, sans-serif; color:#222; line-height:1.5;">
  <div style="background:#eef5fb; padding:18px 22px; border-radius:6px;">
    <h1 style="margin:0; font-size:22px; font-weight:bold;">{{Title}}</h1>
  </div>

  <hr style="margin:26px 0; border:none; border-top:2px solid #d0d7de;">

  <div style="padding:0 22px;">
    <h2 style="margin:0 0 8px; font-size:18px;">Key Highlights</h2>
    <ul>
      <li data-if="highlight_1">{{highlight_1}}</li>
      <li data-if="highlight_2">{{highlight_2}}</li>
      <li data-if="highlight_3">{{highlight_3}}</li>
      <li data-if="highlight_4">{{highlight_4}}</li>
    </ul>
  </div>

  <hr style="margin:26px 0; border:none; border-top:2px solid #d0d7de;">

  <div style="padding:0 22px;">
    <h2 style="margin:0 0 8px; font-size:18px; font-weight:700;">Item Description</h2>
    <div style="white-space:pre-line;">
      {{description_paragraph_1}}

      {{description_paragraph_2}}

      {{description_paragraph_3}}
    </div>
  </div>

  <hr style="margin:14px 0 10px; border:none; border-top:2px solid #d0d7de;">

  <div style="padding:0 22px;">
    <h2 style="margin:0 0 8px; font-size:18px;">Item Details</h2>
    <ul>
      <li data-if="condition">Condition: {{condition}}</li>
      <li data-if="brand">Brand: {{brand}}</li>
      <li data-if="model">Model: {{model}}</li>
      <li data-if="material">Material: {{material}}</li>
      <li data-if="color">Color: {{color}}</li>
      <li data-if="features">Features: {{features}}</li>
    </ul>
  </div>

  <hr style="margin:26px 0; border:none; border-top:2px solid #d0d7de;">

  <div style="padding:0 22px;">
    <h2 style="margin:0 0 8px; font-size:18px;">Shipping & Delivery</h2>
    <span data-if="handling_time">• Handling time: {{handling_time}}<br></span>
    <span data-if="ships_from">• Ships from: {{ships_from}}<br></span>
    <span data-if="estimated_delivery">• Estimated delivery: {{estimated_delivery}}</span>
  </div>
</div>
`;

const MODERN_TEMPLATE = `
<div style="font-family:Arial,Helvetica,sans-serif;width:100%;">
  <div style="background:var(--primary);color:#fff;padding:34px 30px;">
    <div style="font-size:28px;font-weight:800;">{{Title}}</div>

    <div data-if="Subtitle" style="margin-top:6px;font-size:16px;opacity:.9;">
      {{Subtitle}}
    </div>
  </div>

  <div style="background:var(--light);padding:22px 30px;">
    <div style="font-weight:700;color:var(--accent);margin-bottom:10px;">Key Highlights</div>
    <span data-if="highlight_1">✓ {{highlight_1}}<br></span>
    <span data-if="highlight_2">✓ {{highlight_2}}<br></span>
    <span data-if="highlight_3">✓ {{highlight_3}}<br></span>
    <span data-if="highlight_4">✓ {{highlight_4}}</span>
  </div>

  <div style="background:var(--soft);padding:24px 30px;">
    <div style="font-weight:700;color:var(--accent);margin-bottom:12px;">Specifications</div>
    <span data-if="brand">• Brand: {{brand}}<br></span>
    <span data-if="model">• Model: {{model}}<br></span>
    <span data-if="color">• Color: {{color}}<br></span>
    <span data-if="material">• Material: {{material}}<br></span>
    <span data-if="condition">• Condition: {{condition}}</span>
  </div>

  <div style="background:#f7f9ff;padding:26px 30px;">
    <div style="font-weight:700;color:var(--accent);margin-bottom:12px;">Item Description</div>
    {{description_paragraph_1}}<br><br>
    {{description_paragraph_2}}<br><br>
    {{description_paragraph_3}}
  </div>

  <div style="background:linear-gradient(to bottom, #f7f9ff, #ffffff);padding:26px 30px;border-top:2px solid #d9e3ff;">
    <div style="font-weight:700;color:var(--accent);margin-bottom:12px;">Why Buy From Us</div>
    ✓ Fast handling and careful packing<br>
    ✓ Clear photos and honest descriptions<br>
    ✓ Quick and friendly communication<br>
    ✓ If there’s any issue — just message us, we’ll take care of it
  </div>

  <div style="background:var(--primary);color:#fff;padding:26px 30px;">
    <div style="font-weight:700;margin-bottom:12px;">Shipping & Handling</div>
    <span data-if="handling_time">• Handling time: {{handling_time}}<br></span>
    <span data-if="ships_from">• Ships from: {{ships_from}}<br></span>
    <span data-if="estimated_delivery">• Estimated delivery: {{estimated_delivery}}</span>
  </div>
</div>
`;

const SEO_TEMPLATE = `
<div style="width:100%; font-family:Arial,Helvetica,sans-serif; line-height:1.6;">
  <div style="background:var(--primary);padding:28px 30px;border-radius:10px;">
    <div style="font-size:26px;font-weight:800;color:#f9fafb;">{{Title}}</div>

    <div data-if="Subtitle" style="margin-top:8px;font-size:17px;color:#e5e7eb;">
      {{Subtitle}}
    </div>
  </div>

  <div style="margin-top:24px;background:#ffffff;border-radius:10px;overflow:hidden;">
    <div data-if="seo_opening_paragraph" style="margin-top:20px;padding:20px 24px;background:#f9fafb;border-left:6px solid var(--accent);">
      {{seo_opening_paragraph}}
    </div>

    <div style="margin-top:20px;padding:20px 24px;background:#f3f4f6;border-left:6px solid var(--accent);">
      <b>Key Highlights</b><br><br>
      <span data-if="highlight_1">✓ {{highlight_1}}<br></span>
      <span data-if="highlight_2">✓ {{highlight_2}}<br></span>
      <span data-if="highlight_3">✓ {{highlight_3}}<br></span>
      <span data-if="highlight_4">✓ {{highlight_4}}</span>
    </div>

    <div style="margin-top:20px;padding:20px 24px;background:#f3f4f6;border-left:6px solid var(--accent);">
      <b>Specifications</b><br>
      <span data-if="brand">• Brand: {{brand}}<br></span>
      <span data-if="condition">• Condition: {{condition}}<br></span>
      <span data-if="model">• Model: {{model}}<br></span>
      <span data-if="material">• Material: {{material}}<br></span>
      <span data-if="color">• Color: {{color}}<br></span>
      <span data-if="features">• Features: {{features}}</span>
    </div>

    <div style="margin-top:20px;padding:22px 24px;background:#f8fafc;border-left:7px solid var(--primary);">
      <b>Item Description</b><br><br>
      {{seo_description_paragraph_1}}<br><br>
      {{seo_description_paragraph_2}}<br><br>
      {{seo_description_paragraph_3}}
    </div>

    <div style="margin-top:20px;padding:20px 24px;background:#f3f4f6;border-left:6px solid var(--accent);">
      <b>Why Buy From Us</b><br>
      ✓ Accurate descriptions and real product photos<br>
      ✓ Fast handling and careful packaging<br>
      ✓ Clear communication and support<br>
      ✓ Issues are resolved, not ignored
    </div>

    <div style="margin-top:20px;padding:20px 24px;background:#f9fafb;border-left:6px solid var(--accent);">
      <b>Shipping & Delivery</b><br>
      <span data-if="handling_time">• Handling time: {{handling_time}}<br></span>
      <span data-if="ships_from">• Ships from: {{ships_from}}<br></span>
      <span data-if="estimated_delivery">• Estimated delivery: {{estimated_delivery}}</span>
    </div>

    <div data-if="seo_long_tail_paragraph" style="margin-top:20px;padding:20px 24px;background:#f3f4f6;border-left:6px solid var(--primary);font-size:14px;">
      {{seo_long_tail_paragraph}}
    </div>
  </div>
</div>
`;

function createDefaultState() {
  return {
    listingData: {},
    titles: [],
    textDescription: "",
    isDataExpanded: false,
    premiumDescriptionInput: "",
    shippingHandlingTime: "",
    shippingShipsFrom: "",
    shippingEstimatedDelivery: "",
    premiumStyle: "classic",
    premiumThemeName: "",
    premiumDraft: null,
    premiumGeneratedHtml: "",
    premiumGeneratedData: null,
    premiumHtmlSource: "",
    premiumFullHtmlForExport: "",
    loadStatus: { message: "", type: "idle" },
    titleStatus: { message: "", type: "idle" },
    descriptionStatus: { message: "", type: "idle" },
    premiumStatus: { message: "", type: "idle" }
  };
}

const state = createDefaultState();

const elements = {
  clearButton: null,
  closeButton: null,
  loadButton: null,
  loadStatus: null,
  fieldCount: null,
  listingDataList: null,
  toggleDataButton: null,
  createTitleButton: null,
  titleStatus: null,
  titleList: null,
  createDescriptionButton: null,
  descriptionStatus: null,
  descriptionOutput: null,
  premiumStyleBadge: null,
  premiumDescriptionInput: null,
  shippingHandlingTimeInput: null,
  shippingShipsFromInput: null,
  shippingEstimatedDeliveryInput: null,
  premiumStyleButtons: [],
  createPremiumButton: null,
  premiumStatus: null,
  premiumHtmlOutputShell: null,
  premiumHtmlMeta: null,
  copyPremiumHtmlButton: null
};

let persistTimerId = null;
let previewWindowRef = null;

function cacheElements() {
  elements.clearButton = document.getElementById("clearButton");
  elements.closeButton = document.getElementById("closeButton");
  elements.loadButton = document.getElementById("loadButton");
  elements.loadStatus = document.getElementById("loadStatus");
  elements.fieldCount = document.getElementById("fieldCount");
  elements.listingDataList = document.getElementById("listingDataList");
  elements.toggleDataButton = document.getElementById("toggleDataButton");
  elements.createTitleButton = document.getElementById("createTitleButton");
  elements.titleStatus = document.getElementById("titleStatus");
  elements.titleList = document.getElementById("titleList");
  elements.createDescriptionButton = document.getElementById("createDescriptionButton");
  elements.descriptionStatus = document.getElementById("descriptionStatus");
  elements.descriptionOutput = document.getElementById("descriptionOutput");
  elements.premiumStyleBadge = document.getElementById("premiumStyleBadge");
  elements.premiumDescriptionInput = document.getElementById("premiumDescriptionInput");
  elements.shippingHandlingTimeInput = document.getElementById("shippingHandlingTimeInput");
  elements.shippingShipsFromInput = document.getElementById("shippingShipsFromInput");
  elements.shippingEstimatedDeliveryInput = document.getElementById("shippingEstimatedDeliveryInput");
  elements.premiumStyleButtons = Array.from(document.querySelectorAll("[data-style-option]"));
  elements.createPremiumButton = document.getElementById("createPremiumButton");
  elements.premiumStatus = document.getElementById("premiumStatus");
  elements.premiumHtmlOutputShell = document.getElementById("premiumHtmlOutputShell");
  elements.premiumHtmlMeta = document.getElementById("premiumHtmlMeta");
  elements.copyPremiumHtmlButton = document.getElementById("copyPremiumHtmlButton");
}

function validateElements() {
  const requiredKeys = Object.keys(elements).filter(key => key !== "premiumStyleButtons");
  const missing = requiredKeys.filter(key => !elements[key]);

  if (!elements.premiumStyleButtons.length) {
    missing.push("premiumStyleButtons");
  }

  if (missing.length) {
    throw new Error(`Missing popup elements: ${missing.join(", ")}`);
  }
}

function getStorageArea() {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.local) {
    return null;
  }
  return chrome.storage.local;
}

function storageGet(key) {
  return new Promise(resolve => {
    const storage = getStorageArea();
    if (!storage) {
      resolve({});
      return;
    }

    storage.get(key, result => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve({});
        return;
      }
      resolve(result || {});
    });
  });
}

function storageSet(value) {
  return new Promise(resolve => {
    const storage = getStorageArea();
    if (!storage) {
      resolve();
      return;
    }
    storage.set(value, () => resolve());
  });
}

function storageRemove(key) {
  return new Promise(resolve => {
    const storage = getStorageArea();
    if (!storage) {
      resolve();
      return;
    }
    storage.remove(key, () => resolve());
  });
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isFilledValue(value) {
  if (value == null) return false;
  if (Array.isArray(value)) return value.some(isFilledValue);
  if (isPlainObject(value)) return Object.values(value).some(isFilledValue);
  return String(value).trim().length > 0;
}

function normalizeLabel(label) {
  let normalized = String(label || "")
    .replace(/^suggested\s+/i, "")
    .replace(/^itemspecifics\s+/i, "")
    .replace(/\bsuggested\b/gi, "")
    .replace(/\bitemspecifics\b/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (/^category$/i.test(normalized)) {
    normalized = "Category";
  }

  return normalized.replace(/\b\w/g, char => char.toUpperCase());
}

function appendFlattenedField(fields, label, value) {
  if (!isFilledValue(value)) return;

  const cleanedLabel = normalizeLabel(label);

  if (Array.isArray(value)) {
    const primitiveValues = [];

    value.forEach((item, index) => {
      if (!isFilledValue(item)) return;

      if (Array.isArray(item) || isPlainObject(item)) {
        appendFlattenedField(fields, `${cleanedLabel} ${index + 1}`.trim(), item);
        return;
      }

      primitiveValues.push(String(item).trim());
    });

    if (primitiveValues.length) {
      fields.push({ label: cleanedLabel, value: primitiveValues.join(", ") });
    }
    return;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, nestedValue]) => {
      const cleanedKey = normalizeLabel(key);
      const nextLabel = cleanedLabel ? `${cleanedLabel} ${cleanedKey}` : cleanedKey;
      appendFlattenedField(fields, nextLabel.trim(), nestedValue);
    });
    return;
  }

  fields.push({ label: cleanedLabel, value: String(value).trim() });
}

function flattenFilledFields(source) {
  const fields = [];
  Object.entries(source || {}).forEach(([key, value]) => {
    appendFlattenedField(fields, normalizeLabel(key), value);
  });
  return fields.filter(field => field.label && field.value);
}

function hasFilledListingData(listingData) {
  return flattenFilledFields(listingData).length > 0;
}

function setStatus(element, stateKey, message, type) {
  state[stateKey] = {
    message: String(message || ""),
    type: type || "idle"
  };

  if (element) {
    element.textContent = state[stateKey].message;
    element.className =
      type === "success"
        ? "status success"
        : type === "error"
          ? "status error"
          : "status";
  }
}

function renderStatuses() {
  setStatus(elements.loadStatus, "loadStatus", state.loadStatus.message, state.loadStatus.type);
  setStatus(elements.titleStatus, "titleStatus", state.titleStatus.message, state.titleStatus.type);
  setStatus(elements.descriptionStatus, "descriptionStatus", state.descriptionStatus.message, state.descriptionStatus.type);
  setStatus(elements.premiumStatus, "premiumStatus", state.premiumStatus.message, state.premiumStatus.type);
}

function renderDataExpandedState() {
  const expanded = Boolean(state.isDataExpanded);
  elements.listingDataList.classList.toggle("is-hidden", !expanded);
  elements.toggleDataButton.textContent = expanded ? "Hide" : "Show";
  elements.toggleDataButton.setAttribute("aria-expanded", String(expanded));
}

function renderListingData() {
  const fields = flattenFilledFields(state.listingData);
  elements.fieldCount.textContent = `${fields.length} field${fields.length === 1 ? "" : "s"}`;
  elements.listingDataList.innerHTML = "";

  if (!fields.length) {
    elements.listingDataList.classList.add("is-empty");
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "Nothing loaded yet.";
    elements.listingDataList.appendChild(empty);
  } else {
    elements.listingDataList.classList.remove("is-empty");

    fields.forEach(field => {
      const item = document.createElement("div");
      item.className = "data-item";

      const label = document.createElement("div");
      label.className = "data-label";
      label.textContent = field.label;

      const value = document.createElement("div");
      value.className = "data-value";
      value.textContent = field.value;

      item.append(label, value);
      elements.listingDataList.appendChild(item);
    });
  }

  renderDataExpandedState();
}

async function copyText(text) {
  if (!text) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (_error) {
    try {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      const copied = document.execCommand("copy");
      document.body.removeChild(helper);
      return copied;
    } catch {
      return false;
    }
  }
}

function closePopupWindowSafe() {
  try {
    window.close();
  } catch (_error) {
    // ignore
  }
}

async function insertIntoListing(messageType, payload) {
  try {
    const activeTab = await queryActiveTab();

    if (!activeTab || activeTab.id == null) {
      return false;
    }

    const response = await sendMessageToTab(activeTab.id, {
      type: messageType,
      ...payload
    });

    if (response == null) {
      return true;
    }

    if (typeof response === "object" && "ok" in response) {
      return Boolean(response.ok);
    }

    return true;
  } catch (_error) {
    return false;
  }
}

function renderTitles() {
  elements.titleList.innerHTML = "";

  if (!state.titles.length) {
    elements.titleList.classList.add("is-empty");
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "No titles yet.";
    elements.titleList.appendChild(empty);
    return;
  }

  elements.titleList.classList.remove("is-empty");

  state.titles.forEach(titleText => {
    const item = document.createElement("div");
    item.className = "title-item";

    const text = document.createElement("p");
    text.className = "title-text";
    text.textContent = titleText;

    const right = document.createElement("div");
    right.className = "title-copy-wrap";

    const meta = document.createElement("div");
    meta.className = "title-meta";
    meta.textContent = `${titleText.length} chars`;

    const copyButton = document.createElement("button");
    copyButton.className = "button button-secondary";
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", async () => {
      const copied = await copyText(titleText);
      setStatus(elements.titleStatus, "titleStatus", copied ? "Title copied." : "Could not copy title.", copied ? "success" : "error");
      await persistState();
    });

    const insertButton = document.createElement("button");
    insertButton.className = "button button-secondary";
    insertButton.type = "button";
    insertButton.textContent = "Insert";
    insertButton.addEventListener("click", async () => {
      insertButton.disabled = true;
      const inserted = await insertIntoListing(INSERT_TITLE_MESSAGE_TYPE, { title: titleText });

      if (inserted) {
        setStatus(elements.titleStatus, "titleStatus", "Title inserted into listing.", "success");
        await persistState();
        
        return;
      }

      insertButton.disabled = false;
      await persistState();
    });

    right.append(meta, copyButton, insertButton);
    item.append(text, right);
    elements.titleList.appendChild(item);
  });
}

function renderDescription() {
  elements.descriptionOutput.innerHTML = "";

  if (!state.textDescription.trim()) {
    elements.descriptionOutput.classList.add("is-empty");
    const empty = document.createElement("p");
    empty.className = "empty-text";
    empty.textContent = "No text description yet.";
    elements.descriptionOutput.appendChild(empty);
    return;
  }

  elements.descriptionOutput.classList.remove("is-empty");

  const row = document.createElement("div");
  row.className = "description-row";

  const text = document.createElement("p");
  text.className = "description-text";
  text.textContent = state.textDescription;

  const right = document.createElement("div");
  right.className = "description-copy-wrap";

  const meta = document.createElement("div");
  meta.className = "description-meta";
  meta.textContent = `${state.textDescription.length} chars`;

  const copyButton = document.createElement("button");
  copyButton.className = "button button-secondary";
  copyButton.type = "button";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", async () => {
    const copied = await copyText(state.textDescription);
    setStatus(elements.descriptionStatus, "descriptionStatus", copied ? "Text description copied." : "Could not copy text description.", copied ? "success" : "error");
    await persistState();
  });

  const insertButton = document.createElement("button");
  insertButton.className = "button button-secondary";
  insertButton.type = "button";
  insertButton.textContent = "Insert";
  insertButton.addEventListener("click", async () => {
    insertButton.disabled = true;
    const inserted = await insertIntoListing(INSERT_TEXT_DESCRIPTION_MESSAGE_TYPE, { text: state.textDescription });

    if (inserted) {
      setStatus(elements.descriptionStatus, "descriptionStatus", "Text description inserted into listing.", "success");
      await persistState();
      
      return;
    }

    insertButton.disabled = false;
    await persistState();
  });

  right.append(meta, copyButton, insertButton);
  row.append(text, right);
  elements.descriptionOutput.appendChild(row);
}

function formatPremiumStyleLabel(style) {
  const normalized = String(style || "").toLowerCase();
  if (normalized === "modern") return "Modern";
  if (normalized === "seo") return "SEO";
  return "Classic";
}

function getDefaultThemeNameForStyle(style) {
  const normalized = String(style || "").toLowerCase();
  if (normalized === "modern") return "Blue";
  if (normalized === "seo") return "Black";
  return "";
}

function getActiveTheme(style, themeName) {
  const normalizedStyle = String(style || "").toLowerCase();

  if (normalizedStyle !== "modern" && normalizedStyle !== "seo") {
    return DEFAULT_THEME_VARS.classic;
  }

  const presetMap = THEME_PRESETS[normalizedStyle];
  const preferredName = themeName || getDefaultThemeNameForStyle(normalizedStyle);

  if (presetMap && presetMap[preferredName]) {
    return presetMap[preferredName];
  }

  const firstTheme = Object.values(presetMap || {})[0];
  return firstTheme || DEFAULT_THEME_VARS[normalizedStyle];
}

function createThemeVarsStyleTag(theme) {
  return `<style>
:root{
  --primary:${theme.primary};
  --light:${theme.light};
  --soft:${theme.soft};
  --accent:${theme.accent};
}
</style>`;
}

function getContrastTextColor(hex) {
  const value = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return "#ffffff";
  }

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b);

  return luminance > 186 ? "#111827" : "#ffffff";
}

function renderPremiumInputs() {
  elements.premiumDescriptionInput.value = state.premiumDescriptionInput;
  elements.shippingHandlingTimeInput.value = state.shippingHandlingTime;
  elements.shippingShipsFromInput.value = state.shippingShipsFrom;
  elements.shippingEstimatedDeliveryInput.value = state.shippingEstimatedDelivery;
}

function renderPremiumStyleSelection() {
  const selectedStyle = state.premiumStyle;
  elements.premiumStyleBadge.textContent = formatPremiumStyleLabel(selectedStyle);

  elements.premiumStyleButtons.forEach(button => {
    const isActive = button.dataset.styleOption === selectedStyle;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderPremiumResult() {
  elements.premiumHtmlOutputShell.innerHTML = "";
  elements.premiumHtmlMeta.textContent = "";

  const html = String(state.premiumFullHtmlForExport || "").trim();

  if (!html) {
    elements.premiumHtmlOutputShell.classList.add("is-empty");
    const emptyHtml = document.createElement("p");
    emptyHtml.className = "empty-text";
    emptyHtml.textContent = "Generate a premium description to see the HTML here.";
    elements.premiumHtmlOutputShell.appendChild(emptyHtml);

    elements.copyPremiumHtmlButton.disabled = true;
    return;
  }

  elements.premiumHtmlOutputShell.classList.remove("is-empty");

  const htmlField = document.createElement("textarea");
  htmlField.className = "code-output";
  htmlField.readOnly = true;
  htmlField.value = html;
  elements.premiumHtmlOutputShell.appendChild(htmlField);

  elements.premiumHtmlMeta.textContent = `${html.length} chars`;

  elements.copyPremiumHtmlButton.disabled = false;
}

function updateActionAvailability() {
  const hasData = hasFilledListingData(state.listingData);
  elements.createTitleButton.disabled = !hasData;
  elements.createDescriptionButton.disabled = !hasData;
  elements.createPremiumButton.disabled = !hasData;
  elements.copyPremiumHtmlButton.disabled = !state.premiumFullHtmlForExport;
}

function resetPremiumDraftState() {
  state.premiumDraft = null;
  state.premiumGeneratedHtml = "";
  state.premiumGeneratedData = null;
  state.premiumHtmlSource = "";
  state.premiumFullHtmlForExport = "";

  if (state.premiumStatus.type === "success") {
    state.premiumStatus = { message: "", type: "idle" };
  }

  renderStatuses();
  renderPremiumResult();
  updateActionAvailability();
}

function schedulePersistState() {
  if (persistTimerId) {
    window.clearTimeout(persistTimerId);
  }

  persistTimerId = window.setTimeout(() => {
    persistTimerId = null;
    void persistState();
  }, 180);
}

function cloneStateForStorage() {
  return {
    listingData: isPlainObject(state.listingData) ? state.listingData : {},
    titles: Array.isArray(state.titles) ? [...state.titles] : [],
    textDescription: String(state.textDescription || ""),
    isDataExpanded: Boolean(state.isDataExpanded),
    premiumDescriptionInput: String(state.premiumDescriptionInput || ""),
    shippingHandlingTime: String(state.shippingHandlingTime || ""),
    shippingShipsFrom: String(state.shippingShipsFrom || ""),
    shippingEstimatedDelivery: String(state.shippingEstimatedDelivery || ""),
    premiumStyle: String(state.premiumStyle || "classic"),
    premiumThemeName: String(state.premiumThemeName || ""),
    premiumDraft: isPlainObject(state.premiumDraft) ? state.premiumDraft : null,
    premiumGeneratedHtml: String(state.premiumGeneratedHtml || ""),
    premiumGeneratedData: isPlainObject(state.premiumGeneratedData) ? state.premiumGeneratedData : null,
    premiumHtmlSource: String(state.premiumHtmlSource || ""),
    premiumFullHtmlForExport: String(state.premiumFullHtmlForExport || ""),
    loadStatus: { message: String(state.loadStatus.message || ""), type: String(state.loadStatus.type || "idle") },
    titleStatus: { message: String(state.titleStatus.message || ""), type: String(state.titleStatus.type || "idle") },
    descriptionStatus: { message: String(state.descriptionStatus.message || ""), type: String(state.descriptionStatus.type || "idle") },
    premiumStatus: { message: String(state.premiumStatus.message || ""), type: String(state.premiumStatus.type || "idle") }
  };
}

async function persistState() {
  await storageSet({
    [POPUP_STATE_STORAGE_KEY]: cloneStateForStorage()
  });
}

function applyStoredState(snapshot) {
  const nextState = createDefaultState();

  if (snapshot && isPlainObject(snapshot)) {
    if (isPlainObject(snapshot.listingData)) nextState.listingData = snapshot.listingData;
    if (Array.isArray(snapshot.titles)) nextState.titles = snapshot.titles.filter(item => typeof item === "string" && item.trim());
    if (typeof snapshot.textDescription === "string") nextState.textDescription = snapshot.textDescription;

    nextState.isDataExpanded = Boolean(snapshot.isDataExpanded);

    if (typeof snapshot.premiumDescriptionInput === "string") nextState.premiumDescriptionInput = snapshot.premiumDescriptionInput;
    if (typeof snapshot.shippingHandlingTime === "string") nextState.shippingHandlingTime = snapshot.shippingHandlingTime;
    if (typeof snapshot.shippingShipsFrom === "string") nextState.shippingShipsFrom = snapshot.shippingShipsFrom;
    if (typeof snapshot.shippingEstimatedDelivery === "string") nextState.shippingEstimatedDelivery = snapshot.shippingEstimatedDelivery;

    if (typeof snapshot.premiumStyle === "string") {
      const normalizedStyle = snapshot.premiumStyle.toLowerCase();
      nextState.premiumStyle = ["classic", "modern", "seo"].includes(normalizedStyle) ? normalizedStyle : "classic";
    }

    if (typeof snapshot.premiumThemeName === "string") {
      nextState.premiumThemeName = snapshot.premiumThemeName;
    }

    if (isPlainObject(snapshot.premiumDraft)) nextState.premiumDraft = snapshot.premiumDraft;
    if (typeof snapshot.premiumGeneratedHtml === "string") nextState.premiumGeneratedHtml = snapshot.premiumGeneratedHtml;
    if (isPlainObject(snapshot.premiumGeneratedData)) nextState.premiumGeneratedData = snapshot.premiumGeneratedData;
    if (typeof snapshot.premiumHtmlSource === "string") nextState.premiumHtmlSource = snapshot.premiumHtmlSource;
    if (typeof snapshot.premiumFullHtmlForExport === "string") nextState.premiumFullHtmlForExport = snapshot.premiumFullHtmlForExport;

    if (isPlainObject(snapshot.loadStatus)) nextState.loadStatus = { message: String(snapshot.loadStatus.message || ""), type: String(snapshot.loadStatus.type || "idle") };
    if (isPlainObject(snapshot.titleStatus)) nextState.titleStatus = { message: String(snapshot.titleStatus.message || ""), type: String(snapshot.titleStatus.type || "idle") };
    if (isPlainObject(snapshot.descriptionStatus)) nextState.descriptionStatus = { message: String(snapshot.descriptionStatus.message || ""), type: String(snapshot.descriptionStatus.type || "idle") };
    if (isPlainObject(snapshot.premiumStatus)) nextState.premiumStatus = { message: String(snapshot.premiumStatus.message || ""), type: String(snapshot.premiumStatus.type || "idle") };
  }

  state.listingData = nextState.listingData;
  state.titles = nextState.titles;
  state.textDescription = nextState.textDescription;
  state.isDataExpanded = nextState.isDataExpanded;
  state.premiumDescriptionInput = nextState.premiumDescriptionInput;
  state.shippingHandlingTime = nextState.shippingHandlingTime;
  state.shippingShipsFrom = nextState.shippingShipsFrom;
  state.shippingEstimatedDelivery = nextState.shippingEstimatedDelivery;
  state.premiumStyle = nextState.premiumStyle;
  state.premiumThemeName = nextState.premiumThemeName || getDefaultThemeNameForStyle(nextState.premiumStyle);
  state.premiumDraft = nextState.premiumDraft;
  state.premiumGeneratedHtml = nextState.premiumGeneratedHtml;
  state.premiumGeneratedData = nextState.premiumGeneratedData;
  state.premiumHtmlSource = nextState.premiumHtmlSource;
  state.premiumFullHtmlForExport = nextState.premiumFullHtmlForExport;
  state.loadStatus = nextState.loadStatus;
  state.titleStatus = nextState.titleStatus;
  state.descriptionStatus = nextState.descriptionStatus;
  state.premiumStatus = nextState.premiumStatus;
}

async function restoreState() {
  const stored = await storageGet(POPUP_STATE_STORAGE_KEY);
  applyStoredState(stored[POPUP_STATE_STORAGE_KEY]);
}

function resetPremiumInputs() {
  state.premiumDescriptionInput = "";
  state.shippingHandlingTime = "";
  state.shippingShipsFrom = "";
  state.shippingEstimatedDelivery = "";
  state.premiumStyle = "classic";
  state.premiumThemeName = "";
  state.premiumDraft = null;
  state.premiumGeneratedHtml = "";
  state.premiumGeneratedData = null;
  state.premiumHtmlSource = "";
  state.premiumFullHtmlForExport = "";
  state.premiumStatus = { message: "", type: "idle" };
}

async function clearPopupData() {
  state.listingData = {};
  state.titles = [];
  state.textDescription = "";
  state.isDataExpanded = false;
  resetPremiumInputs();
  state.loadStatus = { message: "", type: "idle" };
  state.titleStatus = { message: "", type: "idle" };
  state.descriptionStatus = { message: "", type: "idle" };
  renderAll();
  await storageRemove(POPUP_STATE_STORAGE_KEY);
}

function renderAll() {
  renderListingData();
  renderTitles();
  renderDescription();
  renderPremiumInputs();
  renderPremiumStyleSelection();
  renderPremiumResult();
  renderStatuses();
  updateActionAvailability();
}

function queryActiveTab() {
  return new Promise(resolve => {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
      resolve(null);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (chrome.runtime && chrome.runtime.lastError) {
        resolve(null);
        return;
      }
      resolve(Array.isArray(tabs) ? (tabs[0] || null) : null);
    });
  });
}

function sendMessageToTab(tabId, payload) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.sendMessage || tabId == null) {
      resolve({});
      return;
    }

    chrome.tabs.sendMessage(tabId, payload, response => {
      if (chrome.runtime && chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

async function sendExtractionMessageToTab(tabId) {
  const response = await sendMessageToTab(tabId, { type: EXTRACTION_MESSAGE_TYPE });

  if (response && typeof response === "object") {
    if (response.listingData && typeof response.listingData === "object") {
      return response.listingData;
    }
    return response;
  }

  return {};
}

async function requestListingData(tabId) {
  try {
    return await sendExtractionMessageToTab(tabId);
  } catch (_error) {
    return {};
  }
}

async function extractListingDataFromPage(tabId) {
  if (tabId == null) return {};

  let listingData = {};

  for (let i = 0; i < 3; i++) {
    listingData = await requestListingData(tabId);

    if (hasFilledListingData(listingData)) {
      return listingData;
    }

    await new Promise(resolve => setTimeout(resolve, 700));
  }

  return listingData;
}

function getFieldValue(fields, terms) {
  const normalizedTerms = terms.map(term => term.toLowerCase());

  const match = fields.find(field => {
    const label = String(field.label || "").toLowerCase();
    return normalizedTerms.some(term => label === term || label.includes(term));
  });

  return match ? String(match.value || "") : "";
}

function buildKeywordPool(fields) {
  const keywords = [];

  fields.forEach(field => {
    const text = `${field.label} ${field.value}`;
    text
      .split(/[,/|;:()\u2013\u2014-]+|\s+/)
      .map(part => part.trim())
      .filter(part => part.length > 2)
      .forEach(part => {
        const exists = keywords.some(item => item.toLowerCase() === part.toLowerCase());
        if (!exists) keywords.push(part);
      });
  });

  return keywords;
}

function uniqueParts(parts) {
  const result = [];

  parts.forEach(part => {
    const cleaned = String(part || "").trim();
    if (!cleaned) return;

    const exists = result.some(item => item.toLowerCase() === cleaned.toLowerCase());
    if (!exists) result.push(cleaned);
  });

  return result;
}

function trimTitleToLimit(title, maxLength) {
  const limit = typeof maxLength === "number" ? maxLength : 80;
  if (title.length <= limit) return title;
  return title.slice(0, limit).trim().replace(/[,\-/:;|]+$/, "");
}

function normalizeTitleOption(value) {
  return trimTitleToLimit(String(value || "").replace(/\s+/g, " ").trim(), 80);
}

function normalizeTitleArray(values) {
  const source = Array.isArray(values) ? values : [];
  const output = [];

  source.forEach(item => {
    const title = normalizeTitleOption(item);
    if (!title) return;
    const exists = output.some(existing => existing.toLowerCase() === title.toLowerCase());
    if (!exists) output.push(title);
  });

  return output.slice(0, 3);
}

function normalizeAiTitleResult(result) {
  const raw = result || {};
  const candidates = [
    raw.title_1,
    raw.title_2,
    raw.title_3
  ];

  return normalizeTitleArray(candidates);
}

async function createTitleOptionsWithAiReadyArchitecture(listingData) {
  const fields = flattenFilledFields(listingData);
  const title = getFieldValue(fields, ["title"]);
  const category = getFieldValue(fields, ["category"]);
  const condition = getFieldValue(fields, ["condition"]);

  const dynamicFields = fields.filter(field => {
    const label = field.label.toLowerCase();
    return !["title", "category", "condition"].includes(label);
  });

  const fieldValues = dynamicFields.map(field => field.value);
  const fieldPairs = dynamicFields.map(field => `${field.label} ${field.value}`);
  const keywordPool = buildKeywordPool(dynamicFields);

  const rawOptions = [
    uniqueParts([title, category, condition, ...fieldValues.slice(0, 4), ...keywordPool.slice(0, 4)]).join(" "),
    uniqueParts([title, condition, ...fieldPairs.slice(0, 4), ...keywordPool.slice(4, 8)]).join(" "),
    uniqueParts([category, title, ...keywordPool.slice(8, 14), ...fieldValues.slice(4, 7)]).join(" ")
  ]
    .map(option => trimTitleToLimit(option))
    .filter(Boolean);

  const uniqueOptions = [];
  rawOptions.forEach(option => {
    const exists = uniqueOptions.some(item => item.toLowerCase() === option.toLowerCase());
    if (!exists) uniqueOptions.push(option);
  });

  if (!uniqueOptions.length) uniqueOptions.push("eBay Listing");

  while (uniqueOptions.length < 3) {
    const base = uniqueOptions[0] || "eBay Listing";
    uniqueOptions.push(trimTitleToLimit(`${base} Option ${uniqueOptions.length + 1}`));
  }

  return uniqueOptions.slice(0, 3);
}

function normalizeAiDescriptionResult(result) {
  return String((result && result.description) || "").trim();
}

async function createTextDescriptionWithAiReadyArchitecture(listingData) {
  const fields = flattenFilledFields(listingData);
  const title = getFieldValue(fields, ["title"]);
  const category = getFieldValue(fields, ["category"]);
  const condition = getFieldValue(fields, ["condition"]);

  const dynamicFields = fields.filter(field => {
    const label = field.label.toLowerCase();
    return !["title", "category", "condition"].includes(label);
  });

  const paragraphs = [];

  const introParts = [
    title || "This listing",
    category ? `is listed in ${category}` : "",
    condition ? `and is offered in ${condition.toLowerCase()} condition` : ""
  ].filter(Boolean);

  paragraphs.push(`${introParts.join(" ")}.`.replace(/\s+\./g, "."));

  for (let index = 0; index < dynamicFields.length; index += 5) {
    const chunk = dynamicFields.slice(index, index + 5);
    if (!chunk.length) continue;

    const sentence = chunk.map(field => `${field.label}: ${field.value}`).join("; ");
    paragraphs.push(`Item details include ${sentence}.`);
  }

  paragraphs.push("Please review all specifics, photos, and shipping details before purchase.");

  return paragraphs.join("\n\n");
}

function createPremiumDescriptionDraft() {
  const fields = flattenFilledFields(state.listingData);
  const generatedTitle = state.titles[0] || "";
  const loadedTitle = getFieldValue(fields, ["title"]);
  const category = getFieldValue(fields, ["category"]);
  const condition = getFieldValue(fields, ["condition"]);

  return {
    createdAt: new Date().toISOString(),
    template: state.premiumStyle,
    templateLabel: formatPremiumStyleLabel(state.premiumStyle),
    title: generatedTitle || loadedTitle || "eBay Listing",
    category,
    condition,
    generatedTextDescription: state.textDescription.trim(),
    extraDescription: state.premiumDescriptionInput.trim(),
    shipping: {
      handlingTime: state.shippingHandlingTime.trim(),
      shipsFrom: state.shippingShipsFrom.trim(),
      estimatedDelivery: state.shippingEstimatedDelivery.trim()
    },
    listingData: fields.map(field => ({ label: field.label, value: field.value }))
  };
}

function normalizeSpaces(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function toTitleCase(value) {
  const smallWords = new Set(["and", "or", "of", "in", "to", "for", "with", "a", "an", "the"]);
  const words = normalizeSpaces(value).split(" ").filter(Boolean);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index !== 0 && index !== words.length - 1 && smallWords.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitIntoParagraphs(text) {
  const raw = String(text || "").replace(/\r/g, "").trim();
  if (!raw) return [];

  const existing = raw.split(/\n{2,}/).map(part => normalizeSpaces(part)).filter(Boolean);
  if (existing.length >= 2) return existing;

  const sentences = raw.split(/(?<=[.!?])\s+/).map(sentence => normalizeSpaces(sentence)).filter(Boolean);

  if (sentences.length <= 2) {
    return existing.length ? existing : [raw];
  }

  const chunkSize = Math.ceil(sentences.length / 3);
  const paragraphs = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    paragraphs.push(sentences.slice(index, index + chunkSize).join(" "));
  }

  return paragraphs.filter(Boolean);
}

function getPreferredFieldValue(listingData, terms) {
  return getFieldValue(flattenFilledFields(listingData), terms);
}

function findBrand(listingData) {
  return getPreferredFieldValue(listingData, ["brand"]);
}

function findModel(listingData) {
  return getPreferredFieldValue(listingData, ["model", "style", "mpn"]);
}

function findMaterial(listingData) {
  return getPreferredFieldValue(listingData, ["material", "fabric"]);
}

function findColor(listingData) {
  return getPreferredFieldValue(listingData, ["color", "colour"]);
}

function findFeatures(listingData) {
  const direct = getPreferredFieldValue(listingData, ["features", "feature"]);
  if (direct) return direct;

  const fields = flattenFilledFields(listingData).filter(field => {
    const label = field.label.toLowerCase();
    return !["title", "category", "condition", "brand", "model", "material", "color"].includes(label);
  });

  return fields.slice(0, 4).map(field => `${field.label}: ${field.value}`).join("; ");
}

function buildHighlights(listingData) {
  const fields = flattenFilledFields(listingData).filter(field => {
    const label = field.label.toLowerCase();
    return !["title", "category", "condition"].includes(label);
  });

  const highlights = [];
  const directCandidates = [
    findBrand(listingData) ? `Brand: ${findBrand(listingData)}` : "",
    findModel(listingData) ? `Model: ${findModel(listingData)}` : "",
    findMaterial(listingData) ? `Material: ${findMaterial(listingData)}` : "",
    findColor(listingData) ? `Color: ${findColor(listingData)}` : "",
    getPreferredFieldValue(listingData, ["size"]) ? `Size: ${getPreferredFieldValue(listingData, ["size"])}` : "",
    getPreferredFieldValue(listingData, ["department"]) ? `Department: ${getPreferredFieldValue(listingData, ["department"])}` : ""
  ].filter(Boolean);

  directCandidates.forEach(item => {
    if (!highlights.some(existing => existing.toLowerCase() === item.toLowerCase())) {
      highlights.push(item);
    }
  });

  fields.forEach(field => {
    const candidate = `${field.label}: ${field.value}`;
    if (!highlights.some(existing => existing.toLowerCase() === candidate.toLowerCase())) {
      highlights.push(candidate);
    }
  });

  return highlights.slice(0, 4);
}

function buildFallbackTitle(listingData) {
  const sourceTitle = state.titles[0] || getPreferredFieldValue(listingData, ["title"]);
  if (sourceTitle) return trimTitleToLimit(sourceTitle, 80);

  const parts = uniqueParts([
    findBrand(listingData),
    getPreferredFieldValue(listingData, ["category"]),
    findModel(listingData),
    findColor(listingData),
    getPreferredFieldValue(listingData, ["condition"])
  ]);

  return trimTitleToLimit(parts.join(" ") || "eBay Listing", 80);
}

function buildFallbackSubtitle(listingData) {
  const parts = uniqueParts([
    getPreferredFieldValue(listingData, ["condition"]),
    getPreferredFieldValue(listingData, ["category"]),
    findMaterial(listingData),
    findColor(listingData)
  ]);

  return toTitleCase(parts.slice(0, 3).join(" • ").replace(/\s+•\s+/g, " • "));
}

function buildQuickListingNarrative(listingData) {
  const fields = flattenFilledFields(listingData);
  const title = getFieldValue(fields, ["title"]) || "This item";
  const category = getFieldValue(fields, ["category"]);
  const condition = getFieldValue(fields, ["condition"]);
  const extraFields = fields.filter(field => !["title", "category", "condition"].includes(field.label.toLowerCase())).slice(0, 6);

  const paragraphs = [];
  paragraphs.push(
    normalizeSpaces([title, category ? `is listed in ${category}` : "", condition ? `and is offered in ${condition.toLowerCase()} condition.` : "."].join(" ")).replace(/\s+\./g, ".")
  );

  if (extraFields.length) {
    paragraphs.push(extraFields.map(field => `${field.label}: ${field.value}`).join("; ") + ".");
  }

  paragraphs.push("Please review all listing specifics and photos before purchase.");

  return paragraphs.join("\n\n");
}

function buildLocalPremiumPayload() {
  const listingData = state.listingData;
  const category = getPreferredFieldValue(listingData, ["category"]);
  const condition = getPreferredFieldValue(listingData, ["condition"]);
  const brand = findBrand(listingData);
  const model = findModel(listingData);
  const material = findMaterial(listingData);
  const color = findColor(listingData);
  const features = findFeatures(listingData);

  const fallbackText = state.textDescription.trim() || buildQuickListingNarrative(listingData);

  return {
    tpl: state.premiumStyle,
    category,
    mainText: state.premiumDescriptionInput.trim() || fallbackText,
    brand,
    condition,
    model,
    material,
    color,
    features,
    handling_time: state.shippingHandlingTime.trim(),
    ships_from: state.shippingShipsFrom.trim(),
    estimated_delivery: state.shippingEstimatedDelivery.trim()
  };
}

function buildLocalPremiumData(payload) {
  const listingData = state.listingData;
  const paragraphs = splitIntoParagraphs(payload.mainText || buildQuickListingNarrative(listingData));
  const whileFilling = [...paragraphs];

  while (whileFilling.length < 3) {
    if (whileFilling.length === 0) {
      whileFilling.push("Listing details are available in the item specifics and photos.");
    } else {
      whileFilling.push(whileFilling[whileFilling.length - 1]);
    }
  }

  const title = buildFallbackTitle(listingData);
  const subtitle = buildFallbackSubtitle(listingData);
  const highlights = buildHighlights(listingData);

  return {
    tpl: payload.tpl,
    aiInput: {
      category: payload.category,
      mainText: payload.mainText,
      brand: payload.brand,
      condition: payload.condition,
      model: payload.model,
      material: payload.material,
      color: payload.color,
      features: payload.features
    },
    facts: {
      handling_time: payload.handling_time,
      ships_from: payload.ships_from,
      estimated_delivery: payload.estimated_delivery
    },
    brand: payload.brand,
    condition: payload.condition,
    model: payload.model,
    material: payload.material,
    color: payload.color,
    features: payload.features,
    handling_time: payload.handling_time,
    ships_from: payload.ships_from,
    estimated_delivery: payload.estimated_delivery,
    Title: title,
    Subtitle: subtitle,
    subtitle,
    title,
    seo_opening_paragraph: normalizeSpaces(
      `${title} is presented with the key details currently available in this eBay listing. Review the item specifics, condition notes, and shipping information below for a clearer overview before purchase.`
    ),
    seo_description_paragraph_1: whileFilling[0],
    seo_description_paragraph_2: whileFilling[1],
    seo_description_paragraph_3: whileFilling[2],
    seo_long_tail_paragraph: normalizeSpaces([payload.category, payload.brand, payload.model, payload.color, payload.condition].filter(Boolean).join(" | ")),
    highlight_1: highlights[0] || "",
    highlight_2: highlights[1] || "",
    highlight_3: highlights[2] || "",
    highlight_4: highlights[3] || "",
    description_paragraph_1: whileFilling[0],
    description_paragraph_2: whileFilling[1],
    description_paragraph_3: whileFilling[2],
    mainText: whileFilling.join("\n\n")
  };
}

function normalizePremiumResponse(response) {
  const merged = {
    ...(response || {}),
    ...((response && response.aiInput) ? response.aiInput : {}),
    ...((response && response.facts) ? response.facts : {})
  };

  if (!merged.subtitle) merged.subtitle = merged.tagline || merged.Subtitle || "";
  if (!merged.Subtitle && merged.subtitle) merged.Subtitle = merged.subtitle;
  if (!merged.Title && merged.title) merged.Title = merged.title;
  if (!merged.title && merged.Title) merged.title = merged.Title;

  if (!merged.mainText) {
    merged.mainText = [merged.description_paragraph_1, merged.description_paragraph_2, merged.description_paragraph_3]
      .map(value => normalizeSpaces(value))
      .filter(Boolean)
      .join("\n\n");
  }

  return merged;
}

function fillTemplate(template, data) {
  return String(template || "")
    .replace(
      /<([a-z0-9]+)([^>]*)data-if="(.*?)"([^>]*)>([\s\S]*?)<\/\1>/gi,
      (block, tagName, beforeAttrs, key, afterAttrs, inner) => {
        const value = data[String(key || "").trim()];
        if (!String(value || "").trim()) {
          return "";
        }
        return `<${tagName}${beforeAttrs}${afterAttrs}>${inner}</${tagName}>`;
      }
    )
    .replace(/{{(.*?)}}/g, (_, key) => {
      const value = data[String(key || "").trim()];
      return escapeHtml(value == null ? "" : value);
    });
}

function renderPremiumHtml(data, style) {
  const normalizedData = normalizePremiumResponse(data);
  const styleKey = String(style || normalizedData.tpl || "classic").toLowerCase();

  const template =
    styleKey === "modern"
      ? MODERN_TEMPLATE
      : styleKey === "seo"
        ? SEO_TEMPLATE
        : CLASSIC_TEMPLATE;

  return fillTemplate(template, normalizedData);
}

function buildExportableHtml(bodyHtml, style, themeName) {
  const activeTheme = getActiveTheme(style, themeName);
  return `${createThemeVarsStyleTag(activeTheme)}\n${bodyHtml}`;
}

function createStandalonePreviewDocument(bodyHtml, style, themeName) {
  const activeTheme = getActiveTheme(style, themeName);
  const styleKey = String(style || "classic").toLowerCase();
  const supportsThemes = styleKey === "modern" || styleKey === "seo";
  const presetMap = THEME_PRESETS[styleKey] || {};
  const themeEntries = Object.entries(presetMap);
  const defaultThemeName = themeName || getDefaultThemeNameForStyle(styleKey);

  const themeButtonsHtml = supportsThemes
    ? themeEntries.map(([name, theme]) => {
        const isActive = name === defaultThemeName;
        const textColor = getContrastTextColor(theme.primary);

        return `
          <button
            class="theme-btn${isActive ? " active" : ""}"
            type="button"
            data-theme-name="${escapeHtml(name)}"
            data-primary="${escapeHtml(theme.primary)}"
            data-light="${escapeHtml(theme.light)}"
            data-soft="${escapeHtml(theme.soft)}"
            data-accent="${escapeHtml(theme.accent)}"
            style="background:${escapeHtml(theme.primary)};border-color:${escapeHtml(theme.primary)};color:${escapeHtml(textColor)};"
          >${escapeHtml(name)}</button>
        `;
      }).join("")
    : "";

  const toolbarTitleHtml = supportsThemes
    ? `<div class="toolbar-title">Color style</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
:root{
  --primary:${activeTheme.primary};
  --light:${activeTheme.light};
  --soft:${activeTheme.soft};
  --accent:${activeTheme.accent};
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif}
.preview-page{min-height:100vh;padding:18px}
.toolbar{
  max-width:1100px;
  margin:0 auto 16px;
  padding:14px 16px;
  border-radius:14px;
  background:#ffffff;
  border:1px solid #d8e0ea;
}
.toolbar-title{
  font-size:14px;
  font-weight:700;
  color:#1f2937;
  margin-bottom:10px;
}
.toolbar-buttons{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:center;
}
.theme-btn,
.action-btn{
  border:1px solid transparent;
  border-radius:999px;
  padding:10px 14px;
  font-size:13px;
  font-weight:700;
  cursor:pointer;
  transition:transform .15s ease, box-shadow .15s ease, opacity .15s ease, filter .15s ease;
}
.theme-btn{
  opacity:.94;
}
.theme-btn:hover,
.action-btn:hover{
  transform:translateY(-1px);
}
.theme-btn:hover{
  opacity:1;
  filter:saturate(1.05);
}
.theme-btn.active{
  box-shadow:0 0 0 3px rgba(17,24,39,.16), 0 8px 20px rgba(0,0,0,.18);
}
.action-btn{
  background:#111827;
  border-color:#111827;
  color:#ffffff;
}
.action-btn:disabled{
  opacity:.6;
  cursor:not-allowed;
  transform:none;
}
.preview-wrap{
  max-width:1100px;
  margin:0 auto;
  background:#fff;
  border-radius:16px;
  padding:20px;
  box-shadow:0 18px 40px rgba(15,23,42,.08);
}
</style>
</head>
<body>
  <div class="preview-page">
    <div class="toolbar">
      ${toolbarTitleHtml}
      <div class="toolbar-buttons">
        ${themeButtonsHtml}
        <button id="previewInsertButton" class="action-btn" type="button">Insert into eBay</button>
      </div>
    </div>

    <div class="preview-wrap" id="previewWrap">
      ${bodyHtml}
    </div>
  </div>
</body>
</html>`;
}

async function insertPremiumHtmlIntoActiveListing(html) {
  try {
    const activeTab = await queryActiveTab();

    if (!activeTab || activeTab.id == null) {
      return {
        ok: false,
        message: ""
      };
    }

    const response = await sendMessageToTab(activeTab.id, {
      type: INSERT_PREMIUM_HTML_MESSAGE_TYPE,
      html
    });

    if (response == null) {
      return { ok: true, message: "Premium HTML inserted into eBay." };
    }

    if (typeof response === "object" && "ok" in response) {
      return {
        ok: Boolean(response.ok),
        message: response.ok ? "Premium HTML inserted into eBay." : ""
      };
    }

    return { ok: true, message: "Premium HTML inserted into eBay." };
  } catch (_error) {
    return {
      ok: false,
      message: ""
    };
  }
}

function getSelectedThemeNameFromPreviewDocument(doc, style) {
  const styleKey = String(style || "classic").toLowerCase();
  if (styleKey !== "modern" && styleKey !== "seo") {
    return "";
  }

  const activeButton = doc.querySelector(".theme-btn.active");
  return activeButton ? String(activeButton.dataset.themeName || "").trim() : getDefaultThemeNameForStyle(styleKey);
}

function updatePreviewThemeStateFromButton(doc, button, style) {
  const styleKey = String(style || "classic").toLowerCase();
  const root = doc.documentElement;

  root.style.setProperty("--primary", button.dataset.primary || "");
  root.style.setProperty("--light", button.dataset.light || "");
  root.style.setProperty("--soft", button.dataset.soft || "");
  root.style.setProperty("--accent", button.dataset.accent || "");

  Array.from(doc.querySelectorAll(".theme-btn")).forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");

  const selectedThemeName = String(button.dataset.themeName || "").trim();
  state.premiumThemeName = selectedThemeName;
  state.premiumFullHtmlForExport = buildExportableHtml(
    String(state.premiumGeneratedHtml || "").trim(),
    styleKey,
    selectedThemeName
  );
  void persistState();
}

function attachPreviewWindowControls(previewWindow, style) {
  if (!previewWindow || previewWindow.closed) return;

  const styleKey = String(style || "classic").toLowerCase();
  const doc = previewWindow.document;
  const buttons = Array.from(doc.querySelectorAll(".theme-btn"));

  if (styleKey === "modern" || styleKey === "seo") {
    buttons.forEach(button => {
      button.addEventListener("click", () => {
        updatePreviewThemeStateFromButton(doc, button, styleKey);
      });
    });
  }

  const insertButton = doc.getElementById("previewInsertButton");
  if (insertButton) {
  insertButton.addEventListener("click", async () => {
    insertButton.disabled = true;

    const selectedThemeName = getSelectedThemeNameFromPreviewDocument(doc, styleKey);
    const exportHtml = buildExportableHtml(
      String(state.premiumGeneratedHtml || "").trim(),
      styleKey,
      selectedThemeName
    );

    const result = await insertPremiumHtmlIntoActiveListing(exportHtml);

    if (result.ok) {
      state.premiumThemeName = selectedThemeName;
      state.premiumFullHtmlForExport = exportHtml;
      setStatus(elements.premiumStatus, "premiumStatus", "Inserted into listing.", "success");
    }

    renderPremiumResult();
    updateActionAvailability();
    await persistState();

    // ✅ ВСЕГДА закрываем preview окно
    try {
      previewWindow.close();
    } catch (_error) {
      // ignore
    }
  });
}
}

function openPremiumPreviewWindow(bodyHtml, style, themeName) {
  const docHtml = createStandalonePreviewDocument(bodyHtml, style, themeName);

  if (!previewWindowRef || previewWindowRef.closed) {
    previewWindowRef = window.open("", "ebayPremiumPreviewWindow", "width=1200,height=900,scrollbars=yes,resizable=yes");
  }

  if (!previewWindowRef) return;

  previewWindowRef.document.open();
  previewWindowRef.document.write(docHtml);
  previewWindowRef.document.close();
  attachPreviewWindowControls(previewWindowRef, style);
  previewWindowRef.focus();
}

async function requestAiJsonFromApi(payload) {
  const endpoint = String(PREMIUM_API_ENDPOINT || "").trim();
  if (!endpoint) {
    throw new Error("Premium API endpoint is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt: payload.systemPrompt,
      userPrompt: payload.userPrompt
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `API request failed with status ${response.status}`);
  }

  return await response.json();
}

async function requestPremiumDescriptionFromApi(payload) {
  const json = await requestAiJsonFromApi(payload);
  return normalizePremiumResponse(json);
}

async function handleLoadClick() {
  elements.loadButton.disabled = true;
  setStatus(elements.loadStatus, "loadStatus", "Reading listing data from current eBay page...", "idle");

  try {
    const activeTab = await queryActiveTab();

    if (!activeTab || activeTab.id == null) {
      setStatus(elements.loadStatus, "loadStatus", "Could not access the active tab.", "error");
      await persistState();
      return;
    }

    const extracted = await extractListingDataFromPage(activeTab.id);

    state.listingData = isPlainObject(extracted) ? extracted : {};
    state.titles = [];
    state.textDescription = "";
    state.isDataExpanded = false;
    resetPremiumInputs();

    renderListingData();
    renderTitles();
    renderDescription();
    renderPremiumInputs();
    renderPremiumStyleSelection();
    renderPremiumResult();
    updateActionAvailability();

    const fieldCount = flattenFilledFields(state.listingData).length;

    if (fieldCount > 0) {
      setStatus(elements.loadStatus, "loadStatus", `Loaded ${fieldCount} filled listing fields.`, "success");
      setStatus(elements.titleStatus, "titleStatus", "", "idle");
      setStatus(elements.descriptionStatus, "descriptionStatus", "", "idle");
      setStatus(elements.premiumStatus, "premiumStatus", "", "idle");
    } else {
      setStatus(elements.loadStatus, "loadStatus", "No filled listing data was returned from the page.", "error");
    }

    await persistState();
  } catch (_error) {
    setStatus(elements.loadStatus, "loadStatus", "Extraction failed. The page or content script did not respond.", "error");
    await persistState();
  } finally {
    elements.loadButton.disabled = false;
  }
}

async function handleCreateTitleClick() {
  if (!hasFilledListingData(state.listingData)) {
    setStatus(elements.titleStatus, "titleStatus", "Load listing data first.", "error");
    return;
  }

  elements.createTitleButton.disabled = true;
  setStatus(elements.titleStatus, "titleStatus", "Creating titles...", "idle");

  try {
    const { buildOtherExtractedFields } = await import("./lib/prompts/buildOtherExtractedFields.js");
    const { titlesSystemPrompt, buildTitlesUserPrompt } = await import("./lib/prompts/titlesPrompt.js");

    const otherExtractedFields = buildOtherExtractedFields(state.listingData);

    const titleFields = {
      category: getPreferredFieldValue(state.listingData, ["category"]),
      canonicalBrand: findBrand(state.listingData),
      model: findModel(state.listingData),
      material: findMaterial(state.listingData),
      color: findColor(state.listingData),
      condition: getPreferredFieldValue(state.listingData, ["condition"]),
      features: findFeatures(state.listingData),
      otherExtractedFields
    };

    let titles = [];

    try {
      const raw = await requestAiJsonFromApi({
        systemPrompt: titlesSystemPrompt,
        userPrompt: buildTitlesUserPrompt(titleFields)
      });
      titles = normalizeAiTitleResult(raw);
    } catch (_apiError) {
      titles = await createTitleOptionsWithAiReadyArchitecture(state.listingData);
    }

    state.titles = Array.isArray(titles) ? titles.slice(0, 3) : [];
    renderTitles();

    if (state.titles.length) {
      setStatus(elements.titleStatus, "titleStatus", "Titles created.", "success");
    } else {
      setStatus(elements.titleStatus, "titleStatus", "Could not create titles.", "error");
    }

    await persistState();
  } catch (_error) {
    setStatus(elements.titleStatus, "titleStatus", "Title creation failed.", "error");
  } finally {
    updateActionAvailability();
    elements.createTitleButton.disabled = !hasFilledListingData(state.listingData);
  }
}

async function handleCreateDescriptionClick() {
  if (!hasFilledListingData(state.listingData)) {
    setStatus(elements.descriptionStatus, "descriptionStatus", "Load listing data first.", "error");
    return;
  }

  elements.createDescriptionButton.disabled = true;
  setStatus(elements.descriptionStatus, "descriptionStatus", "Creating text description...", "idle");

  try {
    const { buildOtherExtractedFields } = await import("./lib/prompts/buildOtherExtractedFields.js");
    const { simpleDescriptionSystemPrompt, buildSimpleDescriptionUserPrompt } = await import("./lib/prompts/simpleDescriptionPrompt.js");

    const otherExtractedFields = buildOtherExtractedFields(state.listingData);

    const descriptionFields = {
      category: getPreferredFieldValue(state.listingData, ["category"]),
      canonicalBrand: findBrand(state.listingData),
      model: findModel(state.listingData),
      material: findMaterial(state.listingData),
      color: findColor(state.listingData),
      condition: getPreferredFieldValue(state.listingData, ["condition"]),
      features: findFeatures(state.listingData),
      otherExtractedFields
    };

    let textDescription = "";

    try {
      const raw = await requestAiJsonFromApi({
        systemPrompt: simpleDescriptionSystemPrompt,
        userPrompt: buildSimpleDescriptionUserPrompt(descriptionFields)
      });
      textDescription = normalizeAiDescriptionResult(raw);
    } catch (_apiError) {
      textDescription = await createTextDescriptionWithAiReadyArchitecture(state.listingData);
    }

    state.textDescription = String(textDescription || "").trim();
    renderDescription();

    if (state.textDescription) {
      setStatus(elements.descriptionStatus, "descriptionStatus", "Text description created.", "success");
    } else {
      setStatus(elements.descriptionStatus, "descriptionStatus", "Could not create text description.", "error");
    }

    await persistState();
  } catch (_error) {
    setStatus(elements.descriptionStatus, "descriptionStatus", "Text description creation failed.", "error");
  } finally {
    updateActionAvailability();
    elements.createDescriptionButton.disabled = !hasFilledListingData(state.listingData);
  }
}

async function handleCreatePremiumClick() {
  if (!hasFilledListingData(state.listingData)) {
    setStatus(elements.premiumStatus, "premiumStatus", "Load listing data first.", "error");
    return;
  }

  elements.createPremiumButton.disabled = true;
  setStatus(elements.premiumStatus, "premiumStatus", "Preparing premium description...", "idle");

  try {
    state.premiumDraft = createPremiumDescriptionDraft();

    const payload = buildLocalPremiumPayload();

    const { buildOtherExtractedFields } = await import("./lib/prompts/buildOtherExtractedFields.js");
    const otherExtractedFields = buildOtherExtractedFields(state.listingData);
    payload.otherExtractedFields = otherExtractedFields;

    let systemPrompt = "";
    let userPrompt = "";

    if (state.premiumStyle === "classic") {
      const mod = await import("./lib/prompts/classicPrompt.js");
      systemPrompt = mod.classicSystemPrompt;
      userPrompt = mod.buildClassicUserPrompt({
        category: payload.category,
        canonicalBrand: payload.brand,
        model: payload.model,
        material: payload.material,
        color: payload.color,
        condition: payload.condition,
        features: payload.features,
        otherExtractedFields: payload.otherExtractedFields,
        describeYourItem: payload.mainText,
        handling_time: payload.handling_time,
        ships_from: payload.ships_from,
        estimated_delivery: payload.estimated_delivery
      });
    } else if (state.premiumStyle === "modern") {
      const mod = await import("./lib/prompts/modernPrompt.js");
      systemPrompt = mod.modernSystemPrompt;
      userPrompt = mod.buildModernUserPrompt({
        category: payload.category,
        canonicalBrand: payload.brand,
        model: payload.model,
        material: payload.material,
        color: payload.color,
        condition: payload.condition,
        features: payload.features,
        otherExtractedFields: payload.otherExtractedFields,
        describeYourItem: payload.mainText,
        handling_time: payload.handling_time,
        ships_from: payload.ships_from,
        estimated_delivery: payload.estimated_delivery
      });
    } else {
      const mod = await import("./lib/prompts/seoPrompt.js");
      systemPrompt = mod.seoSystemPrompt;
      userPrompt = mod.buildSeoUserPrompt({
        category: payload.category,
        canonicalBrand: payload.brand,
        model: payload.model,
        material: payload.material,
        color: payload.color,
        condition: payload.condition,
        features: payload.features,
        otherExtractedFields: payload.otherExtractedFields,
        describeYourItem: payload.mainText,
        handling_time: payload.handling_time,
        ships_from: payload.ships_from,
        estimated_delivery: payload.estimated_delivery
      });
    }

    let premiumData;
    let sourceLabel = "";

    try {
      premiumData = await requestPremiumDescriptionFromApi({
        systemPrompt,
        userPrompt
      });
      sourceLabel = "generator API";
    } catch (_apiError) {
      premiumData = buildLocalPremiumData(payload);
      sourceLabel = "local fallback";
    }

    const style = state.premiumStyle;
    const themeName = state.premiumThemeName || getDefaultThemeNameForStyle(style);
    state.premiumThemeName = themeName;

    const premiumHtml = renderPremiumHtml(premiumData, style);
    const premiumFullHtml = buildExportableHtml(premiumHtml, style, themeName);

    state.premiumGeneratedData = premiumData;
    state.premiumGeneratedHtml = premiumHtml;
    state.premiumFullHtmlForExport = premiumFullHtml;
    state.premiumHtmlSource = sourceLabel;

    renderPremiumResult();
    updateActionAvailability();
    openPremiumPreviewWindow(premiumHtml, style, themeName);

    setStatus(
      elements.premiumStatus,
      "premiumStatus",
      `Premium description prepared for ${formatPremiumStyleLabel(state.premiumStyle)} template.`,
      "success"
    );

    await persistState();
  } catch (_error) {
    state.premiumGeneratedData = null;
    state.premiumGeneratedHtml = "";
    state.premiumHtmlSource = "";
    state.premiumFullHtmlForExport = "";
    renderPremiumResult();
    updateActionAvailability();
    setStatus(elements.premiumStatus, "premiumStatus", "Premium description creation failed.", "error");
  } finally {
    updateActionAvailability();
    elements.createPremiumButton.disabled = !hasFilledListingData(state.listingData);
  }
}

async function handleToggleDataClick() {
  state.isDataExpanded = !state.isDataExpanded;
  renderDataExpandedState();
  await persistState();
}

async function handleClearClick() {
  await clearPopupData();
}

async function handleCloseClick() {
  await clearPopupData();
  window.close();
}

async function handleCopyPremiumHtmlClick() {
  const html = String(state.premiumFullHtmlForExport || "").trim();
  if (!html) return;

  const copied = await copyText(html);
  setStatus(elements.premiumStatus, "premiumStatus", copied ? "Premium HTML copied." : "Could not copy premium HTML.", copied ? "success" : "error");
  await persistState();
}

function bindPremiumInputs() {
  elements.premiumDescriptionInput.addEventListener("input", event => {
    state.premiumDescriptionInput = event.target.value;
    resetPremiumDraftState();
    schedulePersistState();
  });

  elements.shippingHandlingTimeInput.addEventListener("input", event => {
    state.shippingHandlingTime = event.target.value;
    resetPremiumDraftState();
    schedulePersistState();
  });

  elements.shippingShipsFromInput.addEventListener("input", event => {
    state.shippingShipsFrom = event.target.value;
    resetPremiumDraftState();
    schedulePersistState();
  });

  elements.shippingEstimatedDeliveryInput.addEventListener("input", event => {
    state.shippingEstimatedDelivery = event.target.value;
    resetPremiumDraftState();
    schedulePersistState();
  });

  elements.premiumStyleButtons.forEach(button => {
    button.addEventListener("click", () => {
      const nextStyle = String(button.dataset.styleOption || "").toLowerCase();
      if (!["classic", "modern", "seo"].includes(nextStyle)) return;
      if (state.premiumStyle === nextStyle) return;

      state.premiumStyle = nextStyle;
      state.premiumThemeName = getDefaultThemeNameForStyle(nextStyle);
      renderPremiumStyleSelection();
      resetPremiumDraftState();
      schedulePersistState();
    });
  });
}

function bindEvents() {
  elements.clearButton.addEventListener("click", () => {
    void handleClearClick();
  });

  elements.closeButton.addEventListener("click", () => {
    void handleCloseClick();
  });

  elements.loadButton.addEventListener("click", () => {
    void handleLoadClick();
  });

  elements.toggleDataButton.addEventListener("click", () => {
    void handleToggleDataClick();
  });

  elements.createTitleButton.addEventListener("click", () => {
    void handleCreateTitleClick();
  });

  elements.createDescriptionButton.addEventListener("click", () => {
    void handleCreateDescriptionClick();
  });

  elements.createPremiumButton.addEventListener("click", () => {
    void handleCreatePremiumClick();
  });

  elements.copyPremiumHtmlButton.addEventListener("click", () => {
    void handleCopyPremiumHtmlClick();
  });

  bindPremiumInputs();
}

async function initializePopup() {
  cacheElements();
  validateElements();
  await restoreState();
  renderAll();
  bindEvents();
}

document.addEventListener("DOMContentLoaded", () => {
  void initializePopup();
});