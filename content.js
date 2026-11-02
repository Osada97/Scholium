const host = document.createElement("my-scholium-root");
host.style.cssText =
  "all: initial; position: absolute; top: 0; left: 0, z-index: 2147483647";
const shadow = host.attachShadow({ mode: "open" });
document.documentElement.appendChild(host);

const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  .btn { position: absolute; padding: 6px 12px; border: 0; border-radius: 8px;
         background: #ffe14d; color: #1b1d2a; font: 600 13px system-ui; cursor: pointer; }
`);
shadow.adoptedStyleSheets = [sheet];

let button = null;

function showButton(rect, text) {
  hideButton();
  button = document.createElement("button");
  button.className = "btn";
  button.textContent = "Explain";
  button.style.left = rect.right + window.scrollX + "px";
  button.style.top = rect.bottom + window.scrollY + 8 + "px";
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", () => console.log("Explain: ", text));
  shadow.appendChild(button);
}

function hideButton() {
  if (button) button.remove();
  button = null;
}

document.addEventListener("mouseup", (e) => {
  if (e.composedPath().includes(host)) return;
  setTimeout(() => {
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (!text) return hideButton();
    showButton(sel.getRangeAt(0).getBoundingClientRect(), text);
  }, 150);
});
