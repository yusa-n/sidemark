/* ===========================
  Utility Functions
=========================== */

// HEX → RGBA
function hexToRgba(hex, alpha = 1) {
  if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) throw new Error("Invalid hex");
  let c = hex.substring(1);
  if (c.length === 3)
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

async function sendMessageToBackground(type, data) {
  const response = await chrome.runtime.sendMessage({ type, ...data });
  if (!response.success) throw new Error(response.error || "Unknown error");
  return response.data;
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/* ===========================
  Floating Icon
=========================== */

const iconHTML = `
  <div class="sidemark-translate-icon" id="sidemarkTranslateIcon">
    <span class="sidemark-emoji">🔗</span>
    <div class="sidemark-menu">
      <div class="sidemark-menu-item" id="sidemarkSettings">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
        Settings
      </div>
      <div class="sidemark-menu-item" id="sidemarkClose">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        Close
      </div>
    </div>
  </div>
`;

function addFloatingIcon() {
  const container = document.createElement("div");
  container.innerHTML = iconHTML.trim();
  document.body.appendChild(container.firstChild);

  const icon = document.getElementById("sidemarkTranslateIcon");
  const settingsBtn = document.getElementById("sidemarkSettings");
  const closeBtn = document.getElementById("sidemarkClose");

  chrome.storage.sync.get("iconPosition", ({ iconPosition }) => {
    if (iconPosition) icon.style.top = iconPosition + "px";
  });

  let dragging = false,
    startY = 0,
    startTop = 0;

  icon.addEventListener("mousedown", (e) => {
    if (e.target.closest(".sidemark-menu")) return;
    dragging = true;
    icon.classList.add("dragging");
    startY = e.clientY;
    startTop = icon.offsetTop;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const delta = e.clientY - startY;
    const newTop = Math.min(
      Math.max(startTop + delta, 20),
      window.innerHeight - icon.offsetHeight - 20,
    );
    icon.style.top = newTop + "px";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    icon.classList.remove("dragging");
    chrome.storage.sync.set({ iconPosition: icon.offsetTop });
  });

  settingsBtn.addEventListener("click", () =>
    chrome.runtime.sendMessage({ action: "openOptions" }),
  );
  closeBtn.addEventListener("click", () => icon.remove());

  window.addEventListener("resize", () => {
    const maxTop = window.innerHeight - icon.offsetHeight - 20;
    if (icon.offsetTop > maxTop) {
      icon.style.top = maxTop + "px";
      chrome.storage.sync.set({ iconPosition: maxTop });
    }
  });
}

/* ===========================
  Initialization
=========================== */

function initialize() {
  addFloatingIcon();
}

/* ===========================
  Start
=========================== */

initialize();
