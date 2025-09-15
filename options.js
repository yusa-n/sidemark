document.addEventListener("DOMContentLoaded", async function () {
  const status = document.getElementById("status");
  const urlInput = document.getElementById("urlInput");
  const addUrlBtn = document.getElementById("addUrlBtn");
  const urlList = document.getElementById("urlList");
  const openAllBtn = document.getElementById("openAllBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const editUrlsTextBtn = document.getElementById("editUrlsTextBtn");
  const urlTextEditor = document.getElementById("urlTextEditor");
  const urlTextArea = document.getElementById("urlTextArea");
  const saveUrlsTextBtn = document.getElementById("saveUrlsTextBtn");
  const cancelUrlsTextBtn = document.getElementById("cancelUrlsTextBtn");
  const urlTextStatus = document.getElementById("urlTextStatus");

  // Show status message
  function showStatus(message, type = "success", target = status) {
    target.textContent = message;
    target.className = `status ${type}`;
    setTimeout(() => {
      target.className = "status";
    }, 3000);
  }

  // Load saved URLs
  async function loadUrls() {
    const result = await chrome.storage.sync.get("savedUrls");
    return result.savedUrls || [];
  }

  // Save a URL
  async function saveUrl(url) {
    const urls = await loadUrls();
    if (!urls.includes(url)) {
      urls.push(url);
      await chrome.storage.sync.set({ savedUrls: urls });
      renderUrlList();
      showStatus("URL added");
    } else {
      showStatus("This URL is already saved", "error");
    }
  }

  // Delete a URL
  async function deleteUrl(url) {
    const urls = await loadUrls();
    const newUrls = urls.filter((u) => u !== url);
    await chrome.storage.sync.set({ savedUrls: newUrls });
    renderUrlList();
    showStatus("URL removed");
  }

  // Render URL list
  async function renderUrlList() {
    const urls = await loadUrls();
    urlList.innerHTML = "";

    if (urls.length === 0) {
      urlList.innerHTML =
        '<div class="url-item" style="color: #666; justify-content: center;">No URLs saved</div>';
      openAllBtn.disabled = true;
      clearAllBtn.disabled = true;
      if (editUrlsTextBtn) editUrlsTextBtn.disabled = false;
      return;
    }

    openAllBtn.disabled = false;
    clearAllBtn.disabled = false;
    if (editUrlsTextBtn) editUrlsTextBtn.disabled = false;

    urls.forEach((url) => {
      const div = document.createElement("div");
      div.className = "url-item";
      div.innerHTML = `
        <a href="${url}" target="_blank" title="${url}">${url}</a>
        <span class="delete-url" title="Delete">×</span>
      `;
      div
        .querySelector(".delete-url")
        .addEventListener("click", () => deleteUrl(url));
      urlList.appendChild(div);
    });
  }

  // Add URL button
  addUrlBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (url) {
      try {
        new URL(url); // URL format check
        await saveUrl(url);
        urlInput.value = "";
      } catch (e) {
        showStatus("Invalid URL format", "error");
      }
    }
  });

  // Allow Enter key to add
  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addUrlBtn.click();
    }
  });

  // Open all URLs button
  openAllBtn.addEventListener("click", async () => {
    const urls = await loadUrls();
    if (urls.length === 0) {
      showStatus("No URLs to open", "error");
      return;
    }
    urls.forEach((url) => {
      chrome.tabs.create({ url, active: false });
    });
    showStatus("Opened all URLs");
  });

  // Clear all URLs button
  clearAllBtn.addEventListener("click", async () => {
    const urls = await loadUrls();
    if (urls.length === 0) {
      showStatus("No URLs to delete", "error");
      return;
    }

    if (confirm("Delete all saved URLs?")) {
      await chrome.storage.sync.set({ savedUrls: [] });
      renderUrlList();
      showStatus("Deleted all URLs");
    }
  });

  // ===== Edit as Text =====
  function openUrlTextEditor(initialUrls) {
    urlTextArea.value = (initialUrls || []).join("\n");
    urlTextEditor.style.display = "block";
    urlTextStatus.className = "status";
  }

  function closeUrlTextEditor() {
    urlTextEditor.style.display = "none";
    urlTextArea.value = "";
    urlTextStatus.className = "status";
  }

  if (editUrlsTextBtn) {
    editUrlsTextBtn.addEventListener("click", async () => {
      const urls = await loadUrls();
      if (urlTextEditor.style.display === "block") {
        closeUrlTextEditor();
      } else {
        openUrlTextEditor(urls);
      }
    });
  }

  if (cancelUrlsTextBtn) {
    cancelUrlsTextBtn.addEventListener("click", () => {
      closeUrlTextEditor();
      showStatus("Edit canceled");
    });
  }

  if (saveUrlsTextBtn) {
    saveUrlsTextBtn.addEventListener("click", async () => {
      const lines = urlTextArea.value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = Array.from(new Set(lines));
      const invalidIndexes = [];
      unique.forEach((u, idx) => {
        try {
          new URL(u);
        } catch {
          invalidIndexes.push(idx + 1);
        }
      });
      if (invalidIndexes.length > 0) {
        const head = invalidIndexes.slice(0, 5).join(", ");
        showStatus(
          `Invalid URL format at lines: ${head}${invalidIndexes.length > 5 ? " …" : ""}`,
          "error",
          urlTextStatus,
        );
        return;
      }
      await chrome.storage.sync.set({ savedUrls: unique });
      await renderUrlList();
      closeUrlTextEditor();
      showStatus("URLs saved");
    });
  }
  renderUrlList();

  const sidebarMenu = document.querySelector(".sidebar-menu");
  const contentSections = document.querySelectorAll(".content-section");

  sidebarMenu.addEventListener("click", (e) => {
    const menuItem = e.target;
    if (menuItem.tagName === "LI") {
      document.querySelectorAll(".sidebar-menu li").forEach((item) => {
        item.classList.remove("active");
      });
      menuItem.classList.add("active");

      const sectionId = menuItem.dataset.section;
      contentSections.forEach((section) => {
        section.classList.remove("active");
        if (section.id === sectionId) {
          section.classList.add("active");
        }
      });
    }
  });
});
