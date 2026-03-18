"use strict";

const EXTRACTION_MESSAGE_TYPE = "EXTRACT_EBAY_LISTING_DATA";
const INSERT_PREMIUM_HTML_MESSAGE_TYPE = "INSERT_PREMIUM_HTML_INTO_LISTING";
const INSERT_TITLE_MESSAGE_TYPE = "INSERT_EBAY_TITLE_INTO_LISTING";
const INSERT_TEXT_DESCRIPTION_MESSAGE_TYPE = "INSERT_EBAY_TEXT_DESCRIPTION_INTO_LISTING";

const ROOT_SELECTOR = [
  "form",
  "main",
  "[role='main']",
  "[data-testid*='listing']",
  "[data-testid*='sell']",
  "[id*='listing']",
  "[id*='sell']"
].join(", ");

const ATTRIBUTE_ROW_SELECTOR = ".summary__attributes--fields.summary__attributes--field[data-testid='attribute']";
const ATTRIBUTE_LABEL_SELECTOR = ".summary__attributes--label .tooltip .fake-link.tooltip__host";
const ATTRIBUTE_BUTTON_VALUE_SELECTOR = ".summary__attributes--value .se-expand-button__button-text";
const ATTRIBUTE_MENU_VALUE_SELECTOR = "[role='menuitemradio'][aria-checked='true'] span";

const NATIVE_CONTROL_SELECTOR = [
  "input:not([type='hidden']):not([type='button']):not([type='submit']):not([type='reset']):not([type='image']):not([type='file'])",
  "select",
  "textarea"
].join(", ");

const CUSTOM_CONTROL_SELECTOR = [
  "[role='combobox']",
  "[aria-autocomplete='list']",
  "[aria-autocomplete='both']",
  "button[aria-haspopup='listbox']",
  "[role='button'][aria-haspopup='listbox']",
  "[contenteditable='true'][role='textbox']",
  "[contenteditable='true'][aria-label]",
  "[contenteditable='true'][aria-labelledby]"
].join(", ");

const CONTROL_SELECTOR = `${NATIVE_CONTROL_SELECTOR}, ${CUSTOM_CONTROL_SELECTOR}`;

const TITLE_HINTS = ["title", "listing title", "item title", "product title"];
const CATEGORY_HINTS = ["category", "suggested category", "primary category", "store category"];
const CONDITION_HINTS = ["condition", "item condition"];
const SHIPPING_HINTS = ["handling time", "dispatch time", "ships from", "item location", "estimated delivery"];
const PRODUCT_ATTRIBUTE_HINTS = [
  "mpn",
  "upc",
  "ean",
  "isbn",
  "gtin",
  "epid",
  "manufacturer part number"
];

const EXCLUDED_LABEL_HINTS = [
  "shipping policy",
  "return policy",
  "payment policy",
  "business policy",
  "buy it now",
  "best offer",
  "price",
  "pricing",
  "quantity",
  "inventory",
  "promotion",
  "promoted",
  "coupon",
  "discount",
  "seller tools",
  "seller tool",
  "recommendation",
  "recommended",
  "traffic",
  "ad rate",
  "listing duration",
  "format",
  "shipping service"
];

const EXCLUDED_SECTION_HINTS = [
  "policy",
  "pricing",
  "price",
  "promotion",
  "promoted",
  "marketing",
  "traffic",
  "discount",
  "coupon",
  "inventory"
];

const PLACEHOLDER_VALUE_PATTERNS = [
  /^(select|choose|search|search here|required|optional)$/i,
  /^(select an option|choose an option|choose one|select one)$/i,
  /^(start typing|type here|type to search)$/i,
  /^(all options|selected|none|n\/a)$/i
];

const DESCRIPTION_FIELD_SELECTORS = [
  "textarea[name*='description' i]",
  "textarea[id*='description' i]",
  "textarea[aria-label*='description' i]",
  "[contenteditable='true'][aria-label*='description' i]",
  "[contenteditable='true'][data-testid*='description' i]",
  "[role='textbox'][contenteditable='true'][aria-label*='description' i]",
  "[name='description']",
  "[id='description']"
];

const VISUAL_DESCRIPTION_SELECTORS = [
  "[contenteditable='true'][aria-label*='description' i]",
  "[contenteditable='true'][data-testid*='description' i]",
  "[contenteditable='true'][id*='description' i]",
  "[contenteditable='true'][class*='description' i]",
  "[contenteditable='true'][role='textbox']",
  "[role='textbox'][contenteditable='true']",
  "[data-testid*='description' i] [contenteditable='true']",
  "[id*='description' i] [contenteditable='true']"
];

const SOURCE_DESCRIPTION_SELECTORS = [
  "textarea[name*='description' i]",
  "textarea[id*='description' i]",
  "textarea[aria-label*='description' i]",
  "[name='description']",
  "[id='description']"
];

const TITLE_INPUT_SELECTORS = [
  "input[name*='title' i]",
  "input[id*='title' i]",
  "input[aria-label*='title' i]",
  "input[placeholder*='title' i]"
];

function createEmptyExtractionResult() {
  return {
    title: "",
    suggestedCategory: "",
    condition: "",
    itemSpecifics: {},
    productAttributes: {},
    shipping: {},
    otherFields: {}
  };
}

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(text) {
  return normalizeWhitespace(text).toLowerCase();
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesHint(text, hints) {
  const haystack = normalizeKey(text);
  return hints.some(hint => haystack.includes(normalizeKey(hint)));
}

function isElementNode(element) {
  return Boolean(element && element.nodeType === 1);
}

function isActuallyVisible(element) {
  if (!isElementNode(element)) {
    return false;
  }

  const view = element.ownerDocument && element.ownerDocument.defaultView ? element.ownerDocument.defaultView : window;
  const style = view.getComputedStyle(element);

  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  return element.getClientRects().length > 0;
}

function isElementVisible(element) {
  if (!isElementNode(element)) {
    return false;
  }

  if (
    element.closest(
      "[hidden], [aria-hidden='true'], [role='dialog'], [role='menu'], [role='listbox'], [aria-modal='true']"
    )
  ) {
    return false;
  }

  return isActuallyVisible(element);
}

function getElementText(element) {
  if (!element || !isElementVisible(element)) {
    return "";
  }

  return normalizeWhitespace(element.innerText || element.textContent || "");
}

function sanitizeLabel(label) {
  return normalizeWhitespace(label)
    .replace(/\s*[:*]\s*$/, "")
    .replace(/\s*\(required\)\s*$/i, "")
    .replace(/\s*\(optional\)\s*$/i, "")
    .replace(/\s*\(recommended\)\s*$/i, "");
}

function sanitizeValue(value) {
  return normalizeWhitespace(value)
    .replace(/\s*~?\d[\d.,]*\s*[kmb]?\s*searches?\b/gi, "")
    .replace(/\bfrequently selected\b/gi, "")
    .replace(/\binfotip\b/gi, "")
    .replace(/\bselected\b/gi, "")
    .replace(/\ball options\b/gi, "")
    .replace(/\btooltip\b/gi, "")
    .replace(/\bsuggested\b/gi, "")
    .replace(/\brecommended\b/gi, "")
    .trim();
}

function stripLabelPrefix(value, label) {
  const cleanedValue = sanitizeValue(value);
  if (!cleanedValue || !label) {
    return cleanedValue;
  }

  const pattern = new RegExp(`^${escapeRegExp(sanitizeLabel(label))}\\s*[:\\-]?\\s*`, "i");
  return normalizeWhitespace(cleanedValue.replace(pattern, ""));
}

function isMeaningfulLabel(label) {
  const cleanedLabel = sanitizeLabel(label);
  if (!cleanedLabel || cleanedLabel.length > 100) {
    return false;
  }

  return !includesHint(cleanedLabel, EXCLUDED_LABEL_HINTS);
}

function isMeaningfulValue(value, label) {
  const cleanedValue = stripLabelPrefix(value, label);
  if (!cleanedValue) {
    return false;
  }

  if (PLACEHOLDER_VALUE_PATTERNS.some(pattern => pattern.test(cleanedValue))) {
    return false;
  }

  if (normalizeKey(cleanedValue) === normalizeKey(label)) {
    return false;
  }

  if (cleanedValue.length > 250) {
    return false;
  }

  return true;
}

function uniqueValues(values) {
  const seen = new Set();
  const result = [];

  values.forEach(value => {
    const normalized = normalizeKey(value);
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    result.push(normalizeWhitespace(value));
  });

  return result;
}

function getIdsText(ids, excludedControl) {
  const normalizedIds = normalizeWhitespace(ids);
  if (!normalizedIds) {
    return "";
  }

  return normalizedIds
    .split(/\s+/)
    .map(id => document.getElementById(id))
    .filter(Boolean)
    .filter(isElementVisible)
    .filter(element => !excludedControl || !excludedControl.contains(element))
    .map(getElementText)
    .map(sanitizeLabel)
    .find(isMeaningfulLabel) || "";
}

function getLabelFromForAttribute(control) {
  if (!control.id) {
    return "";
  }

  const escapedId = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(control.id) : control.id;
  const label = document.querySelector(`label[for="${escapedId}"]`);
  return sanitizeLabel(getElementText(label));
}

function getLabelFromClosestLabel(control) {
  return sanitizeLabel(getElementText(control.closest("label")));
}

function getLabelFromAriaLabel(control) {
  return sanitizeLabel(control.getAttribute("aria-label") || "");
}

function getLabelFromAriaLabelledBy(control) {
  return getIdsText(control.getAttribute("aria-labelledby"), control);
}

function getControlLabel(control) {
  return [
    getLabelFromForAttribute(control),
    getLabelFromClosestLabel(control),
    getLabelFromAriaLabel(control),
    getLabelFromAriaLabelledBy(control)
  ].find(isMeaningfulLabel) || "";
}

function getOptionLabel(control) {
  return [
    getLabelFromForAttribute(control),
    getLabelFromClosestLabel(control),
    getLabelFromAriaLabel(control),
    getLabelFromAriaLabelledBy(control)
  ].find(isMeaningfulLabel) || "";
}

function getGroupLabel(group) {
  if (!group || !isElementNode(group)) {
    return "";
  }

  return [
    sanitizeLabel(group.getAttribute("aria-label") || ""),
    getIdsText(group.getAttribute("aria-labelledby"))
  ].find(isMeaningfulLabel) || "";
}

function getRootCandidates() {
  const candidates = Array.from(new Set(Array.from(document.querySelectorAll(ROOT_SELECTOR))));
  const visibleCandidates = candidates.filter(isElementVisible);
  return visibleCandidates.length ? visibleCandidates : [document.body];
}

function countVisibleControls(container) {
  return Array.from(container.querySelectorAll(`${CONTROL_SELECTOR}, input[type='radio'], input[type='checkbox']`))
    .filter(isElementVisible)
    .length;
}

function scoreRootCandidate(container) {
  const controlCount = countVisibleControls(container);
  if (!controlCount) {
    return Number.NEGATIVE_INFINITY;
  }

  const metadata = normalizeWhitespace([
    container.getAttribute("id"),
    container.getAttribute("data-testid"),
    container.getAttribute("aria-label"),
    container.className
  ].filter(value => typeof value === "string").join(" "));

  let score = controlCount * 3;

  if (includesHint(metadata, ["listing", "sell", "item", "product"])) {
    score += 20;
  }

  if (container.matches("form")) {
    score += 10;
  }

  return score;
}

function getListingRoot() {
  let bestCandidate = document.body;
  let bestScore = Number.NEGATIVE_INFINITY;

  getRootCandidates().forEach(candidate => {
    const score = scoreRootCandidate(candidate);
    if (score > bestScore) {
      bestCandidate = candidate;
      bestScore = score;
    }
  });

  return bestCandidate || document.body;
}

function isInsideExcludedSection(control, root) {
  let current = control.parentElement;

  while (current && current !== root && current !== document.body) {
    const metadata = normalizeWhitespace([
      current.getAttribute("id"),
      current.getAttribute("data-testid"),
      current.getAttribute("aria-label"),
      current.className
    ].filter(value => typeof value === "string").join(" "));

    if (includesHint(metadata, EXCLUDED_SECTION_HINTS)) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function readSelectValue(control, label) {
  const values = Array.from(control.selectedOptions || [])
    .map(option => stripLabelPrefix(option.textContent || option.value || "", label))
    .filter(value => isMeaningfulValue(value, label));

  return uniqueValues(values).join(", ");
}

function readButtonLikeValue(control, label) {
  const candidates = [
    control.querySelector(".se-expand-button__button-text"),
    control.querySelector("[aria-selected='true']"),
    control.querySelector("[data-selected='true']")
  ]
    .map(getElementText)
    .map(value => stripLabelPrefix(value, label))
    .filter(value => isMeaningfulValue(value, label));

  if (candidates.length) {
    return candidates[0];
  }

  const fallbackCandidates = [
    control.value,
    control.getAttribute("aria-valuetext"),
    control.getAttribute("data-selected-value"),
    control.getAttribute("title"),
    getElementText(control)
  ]
    .map(value => stripLabelPrefix(value || "", label))
    .filter(value => isMeaningfulValue(value, label));

  return uniqueValues(fallbackCandidates)[0] || "";
}

function getControlValue(control, label) {
  const tagName = control.tagName.toLowerCase();
  const type = String(control.type || "").toLowerCase();

  if (type === "radio") {
    return stripLabelPrefix(getOptionLabel(control) || control.value || "", label);
  }

  if (type === "checkbox") {
    return stripLabelPrefix(control.value || "Yes", label);
  }

  if (tagName === "input") {
    return stripLabelPrefix(control.value || "", label);
  }

  if (tagName === "textarea") {
    return stripLabelPrefix(control.value || "", label);
  }

  if (tagName === "select") {
    return readSelectValue(control, label);
  }

  return readButtonLikeValue(control, label);
}

function getAttributeRowLabel(row) {
  const label = [
    row.querySelector(ATTRIBUTE_LABEL_SELECTOR),
    row.querySelector(".summary__attributes--label label"),
    row.querySelector(".summary__attributes--label")
  ]
    .map(getElementText)
    .map(sanitizeLabel)
    .find(isMeaningfulLabel);

  return label || "";
}

function getAttributeRowInputValue(row, label) {
  const input = Array.from(
    row.querySelectorAll(
      "input:not([type='hidden']):not([type='radio']):not([type='checkbox']):not([type='button']):not([type='submit']):not([type='reset']):not([type='file'])"
    )
  )
    .filter(isElementVisible)
    .find(control => isMeaningfulValue(control.value || "", label));

  return input ? stripLabelPrefix(input.value || "", label) : "";
}

function getAttributeRowTextareaValue(row, label) {
  const textarea = Array.from(row.querySelectorAll("textarea"))
    .filter(isElementVisible)
    .find(control => isMeaningfulValue(control.value || "", label));

  return textarea ? stripLabelPrefix(textarea.value || "", label) : "";
}

function getAttributeRowSelectValue(row, label) {
  const select = Array.from(row.querySelectorAll("select"))
    .filter(isElementVisible)
    .find(control => {
      const value = readSelectValue(control, label);
      return isMeaningfulValue(value, label);
    });

  return select ? readSelectValue(select, label) : "";
}

function getAttributeRowCheckedRadioValue(row, label) {
  const radio = Array.from(row.querySelectorAll("input[type='radio']:checked"))
    .filter(isElementVisible)
    .find(control => {
      const value = stripLabelPrefix(getOptionLabel(control) || control.value || "", label);
      return isMeaningfulValue(value, label);
    });

  return radio ? stripLabelPrefix(getOptionLabel(radio) || radio.value || "", label) : "";
}

function getAttributeRowCheckedCheckboxValue(row, label) {
  const values = uniqueValues(
    Array.from(row.querySelectorAll("input[type='checkbox']:checked"))
      .filter(isElementVisible)
      .map(control => stripLabelPrefix(getOptionLabel(control) || control.value || "", label))
      .filter(value => isMeaningfulValue(value, label))
  );

  return values.join(", ");
}

function getAttributeRowValue(row, label) {
  const valueCandidates = [
    getElementText(row.querySelector(ATTRIBUTE_BUTTON_VALUE_SELECTOR)),
    getElementText(row.querySelector(ATTRIBUTE_MENU_VALUE_SELECTOR)),
    getAttributeRowCheckedRadioValue(row, label),
    getAttributeRowCheckedCheckboxValue(row, label),
    getAttributeRowInputValue(row, label),
    getAttributeRowTextareaValue(row, label),
    getAttributeRowSelectValue(row, label)
  ]
    .map(value => stripLabelPrefix(value, label))
    .map(sanitizeValue);

  return valueCandidates.find(value => isMeaningfulValue(value, label)) || "";
}

function collectAttributeRowEntries(root) {
  return Array.from(root.querySelectorAll(ATTRIBUTE_ROW_SELECTOR))
    .filter(isElementVisible)
    .map(row => {
      const label = getAttributeRowLabel(row);
      const value = getAttributeRowValue(row, label);

      if (!isMeaningfulLabel(label) || !isMeaningfulValue(value, label)) {
        return null;
      }

      return { label, value };
    })
    .filter(Boolean);
}

function getKnownFieldLabel(control) {
  const type = String(control.type || "").toLowerCase();

  if (type === "radio" || type === "checkbox") {
    const group = control.closest("[role='radiogroup'], [role='group']");
    return sanitizeLabel(getGroupLabel(group) || getControlLabel(control));
  }

  return sanitizeLabel(getControlLabel(control));
}

function isKnownFieldLabel(label) {
  return includesHint(label, [
    ...TITLE_HINTS,
    ...CATEGORY_HINTS,
    ...CONDITION_HINTS,
    ...SHIPPING_HINTS
  ]);
}

function collectKnownFieldEntries(root) {
  return Array.from(root.querySelectorAll(`${CONTROL_SELECTOR}, input[type='radio']:checked, input[type='checkbox']:checked`))
    .filter(isElementVisible)
    .filter(control => !control.closest(ATTRIBUTE_ROW_SELECTOR))
    .filter(control => !isInsideExcludedSection(control, root))
    .map(control => {
      const label = getKnownFieldLabel(control);
      if (!isMeaningfulLabel(label) || !isKnownFieldLabel(label)) {
        return null;
      }

      const value = sanitizeValue(getControlValue(control, label));
      if (!isMeaningfulValue(value, label)) {
        return null;
      }

      return { label, value };
    })
    .filter(Boolean);
}

function dedupeEntries(entries) {
  const seen = new Set();

  return entries.filter(entry => {
    const signature = `${normalizeKey(entry.label)}::${normalizeKey(entry.value)}`;
    if (seen.has(signature)) {
      return false;
    }

    seen.add(signature);
    return true;
  });
}

function assignStructuredValue(target, label, value) {
  if (!(label in target)) {
    target[label] = value;
    return;
  }

  const currentValue = target[label];
  if (Array.isArray(currentValue)) {
    if (!currentValue.includes(value)) {
      currentValue.push(value);
    }
    return;
  }

  if (currentValue !== value) {
    target[label] = [currentValue, value];
  }
}

function shouldExcludeLabel(label) {
  return includesHint(label, EXCLUDED_LABEL_HINTS);
}

function getFieldCategory(label) {
  if (includesHint(label, TITLE_HINTS)) {
    return "title";
  }

  if (includesHint(label, CATEGORY_HINTS)) {
    return "suggestedCategory";
  }

  if (includesHint(label, CONDITION_HINTS)) {
    return "condition";
  }

  if (includesHint(label, SHIPPING_HINTS)) {
    return "shipping";
  }

  if (includesHint(label, PRODUCT_ATTRIBUTE_HINTS)) {
    return "productAttributes";
  }

  return "itemSpecifics";
}

function buildStructuredListingData(entries) {
  const result = createEmptyExtractionResult();

  dedupeEntries(entries).forEach(entry => {
    if (shouldExcludeLabel(entry.label)) {
      return;
    }

    const category = getFieldCategory(entry.label);

    if (category === "title" && !result.title) {
      result.title = entry.value;
      return;
    }

    if (category === "suggestedCategory" && !result.suggestedCategory) {
      result.suggestedCategory = entry.value;
      return;
    }

    if (category === "condition" && !result.condition) {
      result.condition = entry.value;
      return;
    }

    if (category === "shipping") {
      assignStructuredValue(result.shipping, entry.label, entry.value);
      return;
    }

    if (category === "productAttributes") {
      assignStructuredValue(result.productAttributes, entry.label, entry.value);
      return;
    }

    assignStructuredValue(result.itemSpecifics, entry.label, entry.value);
  });

  return result;
}

function extractSuggestedCategoryFromButton(root) {
  const button = root.querySelector("button[name='categoryId']");
  const value = sanitizeValue(getElementText(button));

  return isMeaningfulValue(value, "Category") ? value : "";
}

function extractListingDataFromPage() {
  const root = getListingRoot();
  const entries = [
    ...collectAttributeRowEntries(root),
    ...collectKnownFieldEntries(root)
  ];

  const result = buildStructuredListingData(entries);
  const suggestedCategory = extractSuggestedCategoryFromButton(root);

  if (suggestedCategory) {
    result.suggestedCategory = suggestedCategory;
  }

  return result;
}

function hasExtractedData(data) {
  return Boolean(
    data &&
    (
      data.title ||
      data.suggestedCategory ||
      data.condition ||
      Object.keys(data.itemSpecifics || {}).length ||
      Object.keys(data.productAttributes || {}).length ||
      Object.keys(data.shipping || {}).length ||
      Object.keys(data.otherFields || {}).length
    )
  );
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractListingDataWithRetry() {
  for (let i = 0; i < 8; i++) {
    const data = extractListingDataFromPage();
    if (hasExtractedData(data)) {
      return data;
    }
    await wait(500);
  }

  return createEmptyExtractionResult();
}

function dispatchInputEvents(element) {
  const view = element.ownerDocument && element.ownerDocument.defaultView ? element.ownerDocument.defaultView : window;
  element.dispatchEvent(new view.Event("input", { bubbles: true }));
  element.dispatchEvent(new view.Event("change", { bubbles: true }));
  element.dispatchEvent(new view.Event("blur", { bubbles: true }));
}

function setNativeValue(element, value) {
  const tagName = String(element.tagName || "").toLowerCase();

  if (tagName === "textarea") {
    const descriptor = Object.getOwnPropertyDescriptor(element.ownerDocument.defaultView.HTMLTextAreaElement.prototype, "value");
    if (descriptor && typeof descriptor.set === "function") {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  } else if (tagName === "input") {
    const descriptor = Object.getOwnPropertyDescriptor(element.ownerDocument.defaultView.HTMLInputElement.prototype, "value");
    if (descriptor && typeof descriptor.set === "function") {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  } else {
    element.value = value;
  }

  dispatchInputEvents(element);
}

function fillContentEditable(element, html) {
  element.focus();

  try {
    const selection = element.ownerDocument.getSelection ? element.ownerDocument.getSelection() : null;
    if (selection && element.ownerDocument.createRange) {
      const range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      range.deleteContents();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (_error) {
    // ignore
  }

  element.innerHTML = html;
  dispatchInputEvents(element);
}

function fillContentEditableWithText(element, text) {
  element.focus();

  try {
    const selection = element.ownerDocument.getSelection ? element.ownerDocument.getSelection() : null;
    if (selection && element.ownerDocument.createRange) {
      const range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      range.deleteContents();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (_error) {
    // ignore
  }

  element.textContent = text;
  dispatchInputEvents(element);
}

function collectAccessibleDocuments() {
  const docs = [document];

  Array.from(document.querySelectorAll("iframe")).forEach(iframe => {
    try {
      if (iframe.contentDocument) {
        docs.push(iframe.contentDocument);
      }
    } catch (_error) {
      // ignore cross-origin frames
    }
  });

  return docs;
}

function collectDescriptionCandidatesFromDocument(doc, selectors, predicate) {
  const results = [];

  selectors.forEach(selector => {
    try {
      Array.from(doc.querySelectorAll(selector)).forEach(element => {
        if (!predicate(element)) return;
        if (results.includes(element)) return;
        results.push(element);
      });
    } catch (_error) {
      // ignore bad selector context
    }
  });

  return results;
}

function hasDescriptionLikeMetadata(element) {
  const meta = normalizeKey([
    element.getAttribute("name"),
    element.getAttribute("id"),
    element.getAttribute("aria-label"),
    element.getAttribute("placeholder"),
    element.getAttribute("data-testid"),
    element.className
  ].join(" "));

  return meta.includes("description") || meta.includes("editor") || meta.includes("html");
}

function findVisibleVisualDescriptionTarget() {
  const docs = collectAccessibleDocuments();

  for (const doc of docs) {
    const directCandidates = collectDescriptionCandidatesFromDocument(
      doc,
      VISUAL_DESCRIPTION_SELECTORS,
      element => isActuallyVisible(element)
    );

    const directMatch = directCandidates.find(hasDescriptionLikeMetadata) || directCandidates[0];
    if (directMatch) {
      return directMatch;
    }

    if (doc.body && doc.body.isContentEditable && isActuallyVisible(doc.body)) {
      return doc.body;
    }

    const genericEditable = Array.from(doc.querySelectorAll("[contenteditable='true'], [role='textbox'][contenteditable='true']"))
      .filter(isActuallyVisible);

    const genericMatch = genericEditable.find(hasDescriptionLikeMetadata) || genericEditable[0];
    if (genericMatch) {
      return genericMatch;
    }
  }

  return null;
}

function findVisibleSourceDescriptionTarget() {
  const docs = collectAccessibleDocuments();

  for (const doc of docs) {
    const sourceCandidates = collectDescriptionCandidatesFromDocument(
      doc,
      SOURCE_DESCRIPTION_SELECTORS,
      element => isActuallyVisible(element)
    );

    const sourceMatch = sourceCandidates.find(hasDescriptionLikeMetadata) || sourceCandidates[0];
    if (sourceMatch) {
      return sourceMatch;
    }

    const genericTextarea = Array.from(doc.querySelectorAll("textarea"))
      .filter(isActuallyVisible)
      .find(hasDescriptionLikeMetadata);

    if (genericTextarea) {
      return genericTextarea;
    }
  }

  return null;
}

function findAnyDescriptionTargetFallback() {
  const docs = collectAccessibleDocuments();

  for (const doc of docs) {
    for (const selector of DESCRIPTION_FIELD_SELECTORS) {
      const candidate = doc.querySelector(selector);
      if (candidate && isActuallyVisible(candidate)) {
        return candidate;
      }
    }

    if (doc.body && doc.body.isContentEditable && isActuallyVisible(doc.body)) {
      return doc.body;
    }
  }

  return null;
}

function findTitleInput() {
  const docs = collectAccessibleDocuments();

  for (const doc of docs) {
    for (const selector of TITLE_INPUT_SELECTORS) {
      const candidate = doc.querySelector(selector);
      if (candidate && isActuallyVisible(candidate)) {
        return candidate;
      }
    }

    const fallbacks = Array.from(doc.querySelectorAll("input[type='text'], input:not([type])"))
      .filter(isActuallyVisible)
      .filter(input => {
        const meta = normalizeKey([
          input.getAttribute("name"),
          input.getAttribute("id"),
          input.getAttribute("aria-label"),
          input.getAttribute("placeholder"),
          input.className
        ].join(" "));
        return meta.includes("title");
      });

    if (fallbacks.length) {
      return fallbacks[0];
    }
  }

  return null;
}

function insertTitleIntoListing(text) {
  const target = findTitleInput();

  if (!target) {
    return { ok: false };
  }

  target.focus();
  setNativeValue(target, String(text || ""));

  return { ok: true };
}

function insertTextDescriptionIntoListing(text) {
  const plainText = String(text || "");
  const visualTarget = findVisibleVisualDescriptionTarget();
  const sourceTarget = findVisibleSourceDescriptionTarget();

  let inserted = false;

  if (sourceTarget) {
    setNativeValue(sourceTarget, plainText);
    inserted = true;
  }

  if (visualTarget) {
    fillContentEditableWithText(visualTarget, plainText);
    inserted = true;
  }

  if (!inserted) {
    const fallback = findAnyDescriptionTargetFallback();

    if (!fallback) {
      return { ok: false };
    }

    if (fallback.isContentEditable) {
      fillContentEditableWithText(fallback, plainText);
    } else {
      setNativeValue(fallback, plainText);
    }

    inserted = true;
  }

  return { ok: inserted };
}

function insertPremiumHtmlIntoListing(html) {
  const visualTarget = findVisibleVisualDescriptionTarget();
  const sourceTarget = findVisibleSourceDescriptionTarget();

  let inserted = false;

  if (visualTarget) {
    fillContentEditable(visualTarget, html);
    inserted = true;
  }

  if (sourceTarget) {
    setNativeValue(sourceTarget, html);
    inserted = true;
  }

  if (!inserted) {
    const fallback = findAnyDescriptionTargetFallback();

    if (!fallback) {
      return {
        ok: false,
        message: "Could not insert into the description editor."
      };
    }

    if (fallback.isContentEditable) {
      fillContentEditable(fallback, html);
    } else {
      setNativeValue(fallback, html);
    }

    inserted = true;
  }

  return {
    ok: inserted
  };
}

function handleRuntimeMessage(message, sender, sendResponse) {
  if (!message || typeof message !== "object") {
    return undefined;
  }

  if (message.type === EXTRACTION_MESSAGE_TYPE) {
    (async () => {
      try {
        sendResponse(await extractListingDataWithRetry());
      } catch (_error) {
        sendResponse(createEmptyExtractionResult());
      }
    })();

    return true;
  }

  if (message.type === INSERT_PREMIUM_HTML_MESSAGE_TYPE) {
    try {
      const result = insertPremiumHtmlIntoListing(String(message.html || ""));
      sendResponse(result);
    } catch (_error) {
      sendResponse({
        ok: false,
        message: "Insert failed inside content script."
      });
    }
    return true;
  }

  if (message.type === INSERT_TITLE_MESSAGE_TYPE) {
    try {
      sendResponse(insertTitleIntoListing(String(message.title || "")));
    } catch (_error) {
      sendResponse({ ok: false });
    }
    return true;
  }

  if (message.type === INSERT_TEXT_DESCRIPTION_MESSAGE_TYPE) {
    try {
      sendResponse(insertTextDescriptionIntoListing(String(message.text || "")));
    } catch (_error) {
      sendResponse({ ok: false });
    }
    return true;
  }

  return undefined;
}

if (!globalThis.__EBAY_LISTING_ASSISTANT_CONTENT_SCRIPT_READY__) {
  globalThis.__EBAY_LISTING_ASSISTANT_CONTENT_SCRIPT_READY__ = true;
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);
}