async function openFolderWindow(folderId) {
  const res = await fetch("/api/docs");
  const data = await res.json();
  const folder = data.folders.find((f) => f.id === folderId);
  if (!folder) return;

  // Create window
  const win = document.createElement("div");
  win.classList.add("window");
  win.style.width = "500px";
  win.style.left = `${Math.random() * 200 + 100}px`;
  win.style.top = `${Math.random() * 100 + 40}px`;

  // Title bar
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

  // Window body
  const body = document.createElement("div");
  body.classList.add("window-body");

  const folderView = document.createElement("div");
  folderView.classList.add("folder-view");

  folder.files.forEach((fileId) => {
    const doc = data.docs.find((d) => d.id === fileId);
    if (!doc) return;

    const file = document.createElement("div");
    file.classList.add("file");
    file.dataset.docId = fileId;
    file.addEventListener("dblclick", () => openDocWindow(fileId));

    const img = document.createElement("img");
    img.src = "images/icons/notepad.png";
    img.alt = doc.title;

    const label = document.createElement("span");
    label.textContent = doc.title;

    file.append(img, label);
    folderView.appendChild(file);
  });

  body.appendChild(folderView);
  win.appendChild(body);

  document.querySelector(".desktop").appendChild(win);

  initializeWindowControls(win);
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

  bringToFront(win);
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
