const SYSTEM_BRIEF = [
  "You explain technical terms in plain words that anyone can understand.",
  "Always choose the technical meaning first. If the selection looks misspelled, use the correct name.",
  "If you are not sure what it is, say CONFIDENCE: low instead of guessing.",
  "Answer in exactly this format, one label per line:",
  "TERM: the correct name",
  "TYPE: what kind of thing it is, 1 to 4 words",
  "FULL: what the acronym stands for, or -",
  "CONFIDENCE: high, medium or low",
  "SIMPLE: one or two short sentences",
  "",
  'Example answer for "tls":',
  "TERM: TLS",
  "TYPE: security protocol",
  "FULL: Transport Layer Security",
  "CONFIDENCE: high",
  "SIMPLE: TLS scrambles data between your browser and a website so nobody in between can read it.",
].join("\n");

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

function showButton(rect, text, context) {
  hideButton();
  button = document.createElement("button");
  button.className = "btn";
  button.textContent = "Explain";
  button.style.left = rect.right + window.scrollX + "px";
  button.style.top = rect.bottom + window.scrollY + 8 + "px";
  button.addEventListener("mousedown", (e) => e.preventDefault());
  button.addEventListener("click", () => explain(text, context));
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
    const context = (sel.anchorNode?.parentElement?.textContent || "").slice(
      0,
      600,
    );

    showButton(sel.getRangeAt(0).getBoundingClientRect(), text, context);
  }, 150);
});

async function explain(text, context) {
  const availability = await LanguageModel.availability();
  if (availability !== "available") {
    console.log("Nono is", availability); // 'downloadable', 'downloading' or 'unavailable'
    return;
  }

  const session = await LanguageModel.create({
    initialPrompts: [
      {
        role: "system",
        content: SYSTEM_BRIEF,
      },
    ],
    expectedInputs: [{ type: "text", language: ["en"] }],
    expectedOutput: [{ type: "text", language: ["en"] }],
  });

  const answer = await session.prompt(
    `Selection: "${text}"\nSurrounding text: "${context}"\nExplain the section`,
  );
  console.log(MyScholium.parse(answer));
  session.destroy();
}
