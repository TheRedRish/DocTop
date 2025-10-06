document.querySelectorAll(".window").forEach((win) => {
  makeWindowDraggable(win);
  makeResizable(win);
  handleFocusOnClick(win);

  const minimizeBtn = win.querySelector('[aria-label="Minimize"]');
  const maximizeBtn = win.querySelector('[aria-label="Maximize"]');
  const closeBtn = win.querySelector('[aria-label="Close"]');

  if (minimizeBtn)
    minimizeBtn.addEventListener("click", () => minimizeWindow(win));
  if (maximizeBtn)
    maximizeBtn.addEventListener("click", () => toggleMaximize(win));
  if (closeBtn) closeBtn.addEventListener("click", () => closeWindow(win));

  addTaskbarItem(win);
});

function handleFocusOnClick(win) {
  win.addEventListener("click", () => setWindowFocus(win));
}

function makeWindowDraggable(win) {
  const header = win.querySelector(".title-bar, .window-header");
  let startX = 0,
    startY = 0,
    startLeft = 0,
    startTop = 0;
  let isDragging = false;

  header.addEventListener("mousedown", (e) => {
    if (e.target.closest(".title-bar-controls")) return; // ignore clicks on window controls

    isDragging = true;

    // Get mouse position and element position in the same coordinate space
    const rect = win.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    setWindowFocus(win);
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    win.style.left = `${startLeft + dx}px`;
    win.style.top = `${startTop + dy}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.userSelect = "";
  });
}

function makeResizable(win) {
  const handles = win.querySelectorAll(".resize-handle");
  let isResizing = false;
  let startX,
    startY,
    startWidth,
    startHeight,
    startLeft,
    startTop,
    activeHandle;

  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      e.stopPropagation(); // prevent drag conflict
      isResizing = true;
      activeHandle = handle.classList.contains("tl")
        ? "tl"
        : handle.classList.contains("bl")
        ? "bl"
        : "br";

      const rect = win.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      startLeft = rect.left;
      startTop = rect.top;

      setWindowFocus(win);
      document.body.style.userSelect = "none";
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    switch (activeHandle) {
      case "br": // bottom-right
        win.style.width = `${startWidth + dx}px`;
        win.style.height = `${startHeight + dy}px`;
        break;

      case "bl": // bottom-left
        win.style.width = `${startWidth - dx}px`;
        win.style.height = `${startHeight + dy}px`;
        win.style.left = `${startLeft + dx}px`;
        break;

      case "tl": // top-left
        win.style.width = `${startWidth - dx}px`;
        win.style.height = `${startHeight - dy}px`;
        win.style.left = `${startLeft + dx}px`;
        win.style.top = `${startTop + dy}px`;
        break;
    }
  });

  document.addEventListener("mouseup", () => {
    isResizing = false;
    document.body.style.userSelect = "";
  });
}

function minimizeWindow(win) {
  win.style.display = "none";

  highlightTaskbarItem(win);
}

function toggleMaximize(win) {
  const isMaximized = win.dataset.maximized === "true";

  if (!isMaximized) {
    // Save current size and position
    win.dataset.prevTop = win.offsetTop;
    win.dataset.prevLeft = win.offsetLeft;
    win.dataset.prevWidth = win.offsetWidth;
    win.dataset.prevHeight = win.offsetHeight;

    // Maximize to viewport
    win.style.top = "0px";
    win.style.left = "0px";
    win.style.width = "100%";
    win.style.height = "100%";
    win.dataset.maximized = "true";
  } else {
    // Restore previous size and position
    win.style.top = win.dataset.prevTop + "px";
    win.style.left = win.dataset.prevLeft + "px";
    win.style.width = win.dataset.prevWidth + "px";
    win.style.height = win.dataset.prevHeight + "px";
    win.dataset.maximized = "false";
  }
}

function closeWindow(win) {
  removeTaskbarItem(win);
  win.remove();
}

function setWindowFocus(win) {
  bringToFront(win);
  highlightTaskbarItem(win);
}

let topZ = 10;
function bringToFront(win) {
  topZ += 1;
  win.style.zIndex = topZ;
}

// =============================
// Taskbar Management
// =============================

function addTaskbarItem(win) {
  const taskbar = document.querySelector(".taskbar-windows");
  if (!taskbar) return;

  const title = win.querySelector(".title-bar-text")?.textContent || "Untitled";
  const id = win.dataset.id || Date.now().toString();
  win.dataset.id = id; // ensure ID exists for lookup

  // check if already exists
  if (document.querySelector(`.taskbar-item[data-id="${id}"]`)) return;

  const button = document.createElement("div");
  button.classList.add("taskbar-item");
  button.dataset.id = id;
  button.textContent = title;

  button.addEventListener("click", () => {
    // toggle window visibility / focus
    if (win.style.display === "none") {
      restoreWindow(win);
    } else {
      setWindowFocus(win);
    }
  });

  taskbar.appendChild(button);
  highlightTaskbarItem(win);
}

function removeTaskbarItem(win) {
  const id = win.dataset.id;
  const item = document.querySelector(`.taskbar-item[data-id="${id}"]`);
  if (item) item.remove();
}

// restore a minimized window
function restoreWindow(win) {
  win.style.display = "";
  setWindowFocus(win);
  highlightTaskbarItem(win);
}

// highlight the active window’s taskbar button
function highlightTaskbarItem(win) {
  const id = win.dataset.id;
  const isVisible = win.style.display !== "none";

  document.querySelectorAll(".taskbar-item").forEach((btn) => {
    if (isVisible && btn.dataset.id === id) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}
