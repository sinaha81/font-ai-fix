
function applyTextDirection(el) {
  const text = el.value !== undefined ? el.value : el.textContent;
  const trimmedText = text.trim();
  if (!trimmedText) return;
  if (/[\u0600-\u06FF]/.test(trimmedText)) {
    el.setAttribute("dir", "rtl");
    el.style.textAlign = "right";
  } 
  else if (/[A-Za-z]/.test(trimmedText)) {
    el.setAttribute("dir", "ltr");
    el.style.textAlign = "left";
  } else {
    el.removeAttribute("dir");
    el.style.textAlign = "";
  }
}
function processEditableElements() {
  const textFields = document.querySelectorAll("textarea, input[type='text']");
  textFields.forEach(el => {
    el.addEventListener("input", () => applyTextDirection(el));
    applyTextDirection(el);
  });
  const editableElements = document.querySelectorAll("[contenteditable='true']");
  editableElements.forEach(el => {
    el.addEventListener("input", () => applyTextDirection(el));
    applyTextDirection(el);
  });
}
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.matches("textarea, input[type='text'], [contenteditable='true']")) {
          node.addEventListener("input", () => applyTextDirection(node));
          applyTextDirection(node);
        }
        node.querySelectorAll("textarea, input[type='text'], [contenteditable='true']").forEach(el => {
          el.addEventListener("input", () => applyTextDirection(el));
          applyTextDirection(el);
        });
      }
    });
  });
});
observer.observe(document.body, { childList: true, subtree: true });
processEditableElements();
