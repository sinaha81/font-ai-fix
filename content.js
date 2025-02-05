// تابعی که جهت متن را بر اساس محتوای ورودی تعیین می‌کند
function applyTextDirection(el) {
  // برای المنت‌های ورودی (textarea یا input) از مقدار value استفاده می‌کنیم، در غیر این صورت از textContent
  const text = el.value !== undefined ? el.value : el.textContent;
  const trimmedText = text.trim();

  // اگر متن خالی باشد، هیچ تغییری اعمال نمی‌شود
  if (!trimmedText) return;

  // اگر متن شامل حروف فارسی یا عربی باشد (حتی به‌صورت ترکیبی با حروف انگلیسی)
  if (/[\u0600-\u06FF]/.test(trimmedText)) {
    el.setAttribute("dir", "rtl");
    el.style.textAlign = "right";
  } 
  // در غیر این صورت، اگر متن شامل حروف لاتین باشد
  else if (/[A-Za-z]/.test(trimmedText)) {
    el.setAttribute("dir", "ltr");
    el.style.textAlign = "left";
  } else {
    // در صورت عدم وجود حروف مشخص، می‌توان جهت را پاک کرد یا تنظیم پیش‌فرض اعمال نمود
    el.removeAttribute("dir");
    el.style.textAlign = "";
  }
}

// تابعی که روی تمامی المنت‌های قابل ویرایش موجود در صفحه اجرا می‌شود
function processEditableElements() {
  // انتخاب المنت‌های <textarea> و <input> متنی
  const textFields = document.querySelectorAll("textarea, input[type='text']");
  textFields.forEach(el => {
    // اضافه کردن رویداد input برای تنظیم جهت به صورت لحظه‌ای هنگام تایپ
    el.addEventListener("input", () => applyTextDirection(el));
    // اجرای اولیه جهت تنظیم جهت با مقدار موجود
    applyTextDirection(el);
  });

  // انتخاب المنت‌هایی که دارای ویژگی contenteditable هستند
  const editableElements = document.querySelectorAll("[contenteditable='true']");
  editableElements.forEach(el => {
    el.addEventListener("input", () => applyTextDirection(el));
    applyTextDirection(el);
  });
}

// استفاده از MutationObserver برای نظارت بر المنت‌های داینامیک که بعداً به صفحه اضافه می‌شوند
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      // تنها اگر نود اضافه شده یک المنت باشد
      if (node.nodeType === Node.ELEMENT_NODE) {
        // اگر نود اضافه شده خود یک فیلد ورودی یا contenteditable است
        if (node.matches("textarea, input[type='text'], [contenteditable='true']")) {
          node.addEventListener("input", () => applyTextDirection(node));
          applyTextDirection(node);
        }
        // همچنین به دنبال المنت‌های قابل ویرایش در درون این نود می‌گردیم
        node.querySelectorAll("textarea, input[type='text'], [contenteditable='true']").forEach(el => {
          el.addEventListener("input", () => applyTextDirection(el));
          applyTextDirection(el);
        });
      }
    });
  });
});

// نظارت بر تغییرات در بدنه صفحه
observer.observe(document.body, { childList: true, subtree: true });

// اجرای اولیه برای المنت‌های موجود در صفحه
processEditableElements();
