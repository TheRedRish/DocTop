import windows from "/js/windows.js";

async function init() {
  const res = await fetch("/api/docs");
  const data = await res.json();

  for (const folder of data.folders) {
    windows.renderFolderIcon(
      document.querySelector("#desktop .desktop-icons"),
      folder,
      ["desktop-icon"]
    );
  }
}

init();
