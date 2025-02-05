const defaultConfig = {
  autoTextDirectionEnabled: true, 
  debounceTime: 300,                
  pollingInterval: 2000,           
  debugMode: false                  
};
let config = { ...defaultConfig };

try {
  const storedConfig = JSON.parse(localStorage.getItem("autoTextDirectionConfig"));
  if (storedConfig) {
    config = { ...config, ...storedConfig };
  }
} catch (e) {
  console.error("خطا در خواندن تنظیمات از localStorage:", e);
}

function logDebug(message) {
  if (config.debugMode) {
    console.log("[AutoTextDirection] " + message);
  }
}

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function showTooltip(message, x, y) {
  const tooltip = document.createElement("div");
  tooltip.textContent = message;
  tooltip.style.position = "fixed";
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
  tooltip.style.padding = "5px 8px";
  tooltip.style.background = "rgba(0, 0, 0, 0.75)";
  tooltip.style.color = "#fff";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "12px";
  tooltip.style.zIndex = 9999;
  tooltip.style.pointerEvents = "none";
  document.body.appendChild(tooltip);
  setTimeout(() => {
    tooltip.parentNode.removeChild(tooltip);
  }, 1500);
}

function detectTextDirection(text) {
  const trimmedText = text.trim();
  if (!trimmedText) return null;

  const rtlMatches = trimmedText.match(/[\u0600-\u06FF\u0590-\u05FF]/g) || [];
  const ltrMatches = trimmedText.match(/[A-Za-z]/g) || [];
  
  logDebug(`متن: "${trimmedText}" | RTL: ${rtlMatches.length} | LTR: ${ltrMatches.length}`);
  
  if (rtlMatches.length > 0 || (ltrMatches.length > 0 && rtlMatches.length > ltrMatches.length)) {
    return "rtl";
  }

  return "ltr";
}

function applyTextDirection(el) {
  if (el.closest("nav")) return;
  if (el.getAttribute("data-auto-text-dir-manual") === "true") {
    logDebug("این المنت در حالت override دستی است، به‌روزرسانی خودکار نادیده گرفته شد.");
    return;
  }
  
  const text = el.value !== undefined ? el.value : el.textContent;
  const direction = detectTextDirection(text);
  
  if (!direction) {
    el.removeAttribute("dir");
    el.style.textAlign = "";
    return;
  }
  
  if (direction === "rtl") {
    el.setAttribute("dir", "rtl");
    el.style.textAlign = "right";
  } else {
    el.setAttribute("dir", "ltr");
    el.style.textAlign = "left";
  }
  logDebug(`جهت المنت ${el.tagName} به ${direction} تنظیم شد.`);
}

function updateElement(el) {
  if (config.autoTextDirectionEnabled) {
    applyTextDirection(el);
  }
}

function setupElement(el) {
  if (el.__autoTextDirectionSetup) return;
  el.__autoTextDirectionSetup = true;
  const debouncedUpdate = debounce(() => updateElement(el), config.debounceTime);
  
  el.addEventListener("input", debouncedUpdate);
  el.addEventListener("paste", () => setTimeout(debouncedUpdate, 0));
  el.addEventListener("focus", debouncedUpdate);
  el.addEventListener("blur", debouncedUpdate);
  
  el.addEventListener("dblclick", () => {
    if (el.getAttribute("data-auto-text-dir-manual") === "true") {
      el.removeAttribute("data-auto-text-dir-manual");
      logDebug("حالت override دستی از المنت برداشته شد.");
    }
    const currentDir = el.getAttribute("dir");
    const newDir = currentDir === "rtl" ? "ltr" : "rtl";
    el.setAttribute("dir", newDir);
    el.style.textAlign = newDir === "rtl" ? "right" : "left";
    logDebug(`جهت توسط double-click تغییر یافت به: ${newDir}`);
    showTooltip(newDir.toUpperCase(), el.getBoundingClientRect().left, el.getBoundingClientRect().top - 25);
  });
  
  el.addEventListener("contextmenu", (e) => {
    if (e.shiftKey) {
      e.preventDefault();
      const manualState = el.getAttribute("data-auto-text-dir-manual") === "true";
      if (manualState) {
        el.removeAttribute("data-auto-text-dir-manual");
        logDebug("Override دستی غیرفعال شد.");
        updateElement(el);
      } else {
        el.setAttribute("data-auto-text-dir-manual", "true");
        logDebug("Override دستی فعال شد.");
        showTooltip("MANUAL", e.clientX, e.clientY);
      }
    }
  });
  
  updateElement(el);
  
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          debouncedUpdate();
        }
      });
    });
    io.observe(el);
  }
}

function processEditableElements() {
  const selectors = "input[type='text'], textarea, [contenteditable='true']";
  const elements = document.querySelectorAll(selectors);
  elements.forEach(setupElement);
}

const mutationObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches("input[type='text'], textarea, [contenteditable='true']")) {
          setupElement(node);
        }
        node.querySelectorAll("input[type='text'], textarea, [contenteditable='true']").forEach(setupElement);
      }
    });
  });
});
mutationObserver.observe(document.body, { childList: true, subtree: true });

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "t") {
    config.autoTextDirectionEnabled = !config.autoTextDirectionEnabled;
    logDebug("تنظیم خودکار جهت فعال است: " + config.autoTextDirectionEnabled);
    if (config.autoTextDirectionEnabled) {
      processEditableElements();
    }
  }
});

document.addEventListener("keydown", function (e) {
  if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "l") {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.matches("input[type='text'], textarea, [contenteditable='true']")) {
      if (activeEl.getAttribute("data-auto-text-dir-manual") === "true") {
        activeEl.removeAttribute("data-auto-text-dir-manual");
      }
      const currentDir = activeEl.getAttribute("dir");
      const newDir = currentDir === "rtl" ? "ltr" : "rtl";
      activeEl.setAttribute("dir", newDir);
      activeEl.style.textAlign = newDir === "rtl" ? "right" : "left";
      logDebug(`جهت المنت فعال توسط کلید میانبر تغییر یافت به: ${newDir}`);
      showTooltip(newDir.toUpperCase(), activeEl.getBoundingClientRect().left, activeEl.getBoundingClientRect().top - 25);
    }
  }
});

window.addEventListener("resize", processEditableElements);

setInterval(() => {
  const activeEl = document.activeElement;
  if (activeEl && activeEl.matches("input[type='text'], textarea, [contenteditable='true']")) {
    updateElement(activeEl);
  }
}, config.pollingInterval);

window.addEventListener("storage", function (e) {
  if (e.key === "autoTextDirectionConfig") {
    try {
      const newConfig = JSON.parse(e.newValue);
      config = { ...config, ...newConfig };
      logDebug("تنظیمات از طریق storage به‌روزرسانی شدند.");
      processEditableElements();
    } catch (err) {
      console.error("خطا در پارس کردن تنظیمات:", err);
    }
  }
});

processEditableElements();
