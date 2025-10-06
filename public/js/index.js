document.querySelectorAll(".window").forEach((win) => {
  makeWindowDraggable(win);
  makeResizable(win);
});

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

    bringToFront(win);
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

      bringToFront(win);
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

let topZ = 10;
function bringToFront(win) {
  topZ += 1;
  win.style.zIndex = topZ;
}
