function initializeWindowControls(win) {
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
}

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

async function openFolderWindow(folderId) {
  const res = await fetch("/api/docs");
  const data = await res.json();
  const folder = data.folders.reduce((acc, f) => {
    if (f.id === folderId) return f;
    if (f.subfolders) {
      const subfolder = f.subfolders.find((s) => s.id === folderId);
      if (subfolder) return subfolder;
    }
    return acc;
  }, null);
  if (!folder) return;

  // === Create main window ===
  const win = document.createElement("div");
  win.classList.add("window");
  win.style.width = "800px";
  win.style.height = "500px";
  win.style.left = `${Math.random() * 200 + 100}px`;
  win.style.top = `${Math.random() * 100 + 40}px`;

  // === Window handlebars ===

  const tlResizeHandle = document.createElement("div");
  tlResizeHandle.classList.add("resize-handle", "tl");
  const blResizeHandle = document.createElement("div");
  blResizeHandle.classList.add("resize-handle", "bl");
  const brResizeHandle = document.createElement("div");
  brResizeHandle.classList.add("resize-handle", "br");

  win.appendChild(tlResizeHandle);
  win.appendChild(blResizeHandle);
  win.appendChild(brResizeHandle);

  // === Title Bar ===
  const titleBar = document.createElement("div");
  titleBar.classList.add("title-bar");

  const titleText = document.createElement("div");
  titleText.classList.add("title-bar-text");
  titleText.textContent = folder.name;

  const controls = document.createElement("div");
  controls.classList.add("title-bar-controls");
  ["Minimize", "Maximize", "Close"].forEach((label) => {
    const btn = document.createElement("button");
    btn.setAttribute("aria-label", label);
    controls.appendChild(btn);
  });

  titleBar.append(titleText, controls);
  win.appendChild(titleBar);

  // === Explorer body ===
  const explorerBody = document.createElement("div");
  explorerBody.classList.add("window-body", "explorer");
  explorerBody.id = "explorer";

  // --- LEFT PANEL: Folder tree ---
  const foldersSection = document.createElement("div");
  foldersSection.classList.add("folders-section");

  const folderHeader = document.createElement("div");
  folderHeader.classList.add("folder-section--header");
  const headerTitle = document.createElement("span");
  headerTitle.textContent = "Folders";
  const headerClose = document.createElement("img");
  headerClose.src = "images/icons/close-x.svg";
  folderHeader.append(headerTitle, headerClose);

  const folderContent = document.createElement("div");
  folderContent.classList.add("folder-section--content");

  const tree = document.createElement("ul");
  tree.classList.add("tree-view");

  buildTreeNode(tree, folder, data); // Recursive builder
  folderContent.appendChild(tree);
  foldersSection.append(folderHeader, folderContent);

  // --- RIGHT PANEL: Content section ---
  const contentSection = document.createElement("div");
  contentSection.classList.add("content-section");

  const iconContainer = document.createElement("div");
  iconContainer.classList.add("explorer-icons");

  renderFolderFiles(iconContainer, folder, data);
  contentSection.appendChild(iconContainer);

  explorerBody.append(foldersSection, contentSection);
  win.appendChild(explorerBody);

  // Add to desktop
  document.querySelector(".desktop").appendChild(win);

  // Enable window behavior (drag, resize, etc.)
  initializeWindowControls(win);

  // Set window focus
  setWindowFocus(win);
}

// Recursively builds the folder tree (left side)
function buildTreeNode(parentEl, folder, data) {
  const li = document.createElement("li");
  const details = document.createElement("details");
  details.open = true;

  const summary = document.createElement("summary");
  const folderIcon = document.createElement("img");
  folderIcon.src = "/images/icons/folder-explorer.png";
  folderIcon.alt = "";
  folderIcon.classList.add("tree-icon");

  summary.append(folderIcon, document.createTextNode(folder.name));
  details.appendChild(summary);

  const ul = document.createElement("ul");

  // Files in folder
  folder.files?.forEach((fileId) => {
    const doc = data.files.find((d) => d.id === fileId);
    if (!doc) return;
    const fileLi = document.createElement("li");
    const link = document.createElement("a");

    const fileIcon = document.createElement("img");
    fileIcon.src = "/images/icons/notepad.png";
    fileIcon.alt = "";
    fileIcon.classList.add("tree-icon");

    link.append(fileIcon, document.createTextNode(doc.title));
    link.href = "#";
    link.addEventListener("dblclick", (e) => {
      e.preventDefault();
      openDocWindow(fileId);
    });

    fileLi.appendChild(link);
    ul.appendChild(fileLi);
  });

  // Subfolders
  folder.subfolders?.forEach((sub) => buildTreeNode(ul, sub, data));

  details.appendChild(ul);
  li.appendChild(details);
  parentEl.appendChild(li);
}

// Renders the right-hand icons grid
function renderFolderFiles(container, folder, data) {
  // Subfolders
  folder.subfolders?.forEach((sub) => {
    renderFolderIcon(container, sub, ["explorer-icon"]);
  });

  // Files
  folder.files?.forEach((fileId) => {
    const doc = data.files.find((d) => d.id === fileId);
    if (!doc) return;

    renderDocIcon(container, doc, ["explorer-icon"]);
  });
}

function renderFolderIcon(container, folder, classes) {
  renderIcon(
    container,
    folder.id,
    "images/icons/folder-document.png",
    folder.name,
    openFolderWindow,
    ["folder", ...classes]
  );
}

function renderDocIcon(container, doc, classes) {
  renderIcon(
    container,
    doc.id,
    "images/icons/notepad.png",
    doc.title,
    openDocWindow,
    ["file", ...classes]
  );
}

function renderIcon(container, id, img, title, event, classes) {
  const div = document.createElement("div");
  div.classList.add("icon", ...classes);
  div.dataset.docId = id;
  div.addEventListener("dblclick", () => event(id));

  const imgContainer = document.createElement("img");
  imgContainer.src = img;
  imgContainer.alt = title;

  const label = document.createElement("span");
  label.classList.add("limited-text");
  label.textContent = title;

  div.append(imgContainer, label);
  container.appendChild(div);
}

async function openDocWindow(docId) {
  const res = await fetch(`/api/docs/${docId}`);
  const doc = await res.json();

  // create outer window
  const win = document.createElement("div");
  win.classList.add("window");
  win.style.width = "60%";
  win.style.left = `${Math.random() * 200 + 100}px`;
  win.style.top = `${Math.random() * 100 + 40}px`;
  win.style.height = `calc(100% - ${win.style.top} - 20px)`;

  // === TITLE BAR ===
  const titleBar = document.createElement("div");
  titleBar.classList.add("title-bar");

  const titleText = document.createElement("div");
  titleText.classList.add("title-bar-text");
  titleText.textContent = doc.title;

  const controls = document.createElement("div");
  controls.classList.add("title-bar-controls");

  ["Minimize", "Maximize", "Close"].forEach((label) => {
    const btn = document.createElement("button");
    btn.setAttribute("aria-label", label);
    controls.appendChild(btn);
  });

  titleBar.append(titleText, controls);
  win.appendChild(titleBar);

  // === WINDOW BODY ===
  const body = document.createElement("div");
  body.classList.add("window-body");

  const toolbar = document.createElement("div");
  toolbar.classList.add("toolbar");

  ["File", "Edit", "View", "Help"].forEach((name) => {
    const btn = document.createElement("button");
    btn.classList.add("button");
    btn.textContent = name;
    toolbar.appendChild(btn);
  });

  const content = document.createElement("div");
  content.classList.add("content");
  content.style.padding = "10px";

  body.append(toolbar, content);
  win.appendChild(body);

  // === Resize handles ===
  ["tl", "bl", "br"].forEach((pos) => {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle", pos);
    win.appendChild(handle);
  });

  // attach to desktop
  document.querySelector(".desktop").appendChild(win);

  // initialize window logic
  initializeWindowControls(win);

  // render content
  renderDocContent(content, doc);

  setWindowFocus(win);
}

function renderDocContent(container, doc) {
  const title = document.createElement("h1");
  title.textContent = doc.title;
  container.appendChild(title);

  const desc = document.createElement("p");
  desc.textContent = doc.description;
  container.appendChild(desc);

  doc.sections.forEach((section) => {
    const sec = document.createElement("div");
    sec.classList.add("section");

    if (section.heading) {
      const h2 = document.createElement("h2");
      h2.textContent = section.heading;
      sec.appendChild(h2);
    }

    if (section.content) {
      const p = document.createElement("p");
      p.textContent = section.content;
      sec.appendChild(p);
    }

    if (section.list) {
      const ul = document.createElement("ul");
      section.list.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        ul.appendChild(li);
      });
      sec.appendChild(ul);
    }

    if (section.codeBlocks) {
      section.codeBlocks.forEach((cb) => {
        const pre = document.createElement("pre");
        pre.classList.add("codeblock");
        const code = document.createElement("code");
        code.textContent = cb.code;
        pre.appendChild(code);
        sec.appendChild(pre);
      });
    }

    container.appendChild(sec);
  });
}

export default {
  renderFolderIcon: renderFolderIcon,
  renderDocIcon: renderDocIcon,
  renderIcon: renderIcon,
};
