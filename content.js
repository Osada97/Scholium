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

const SYSTEM_MORE = [
  "You explain technical terms in plain words. The reader already saw a short explanation (given below).",
  "Add more depth without repeating it. Answer in exactly this format, one label per line:",
  "DETAILS: two to four sentences on what it does and why people use it",
  "ANALOGY: one everyday comparison",
  "EXAMPLE: one short, concrete example",
  "RELATED: 3 to 5 related technical terms, comma separated",
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
  .card { position: absolute; width: 340px; padding: 16px 18px; border-radius: 14px;
          background: #fcfcfd; color: #1b1d2a; border: 1px solid #e2e4ec;
          box-shadow: 0 20px 44px -18px rgba(27, 29, 42, 0.4); font: 15px/1.5 system-ui; }
  .headword { margin: 0; font-size: 24px; }
  .swash { padding: 0 0.18em;
           background: linear-gradient(97deg, transparent 1%, #ffe14d 1.6%, #ffe14d 96.5%, transparent 98.5%) no-repeat 0 86% / 100% 56%; }
  .kind { margin: 2px 0 10px; font-style: italic; color: #5b6075; }
  .simple { margin: 0; }
  .more p { margin: 10px 0 0; }
  .label { display: block; font-size: 12.5px; font-weight: 700; color: #5b6075; }
  .more-btn { margin-top: 12px; padding: 6px 12px; border: 0; border-radius: 8px;
              background: #eef0fd; color: #3346d3; font: 700 13px system-ui; cursor: pointer; }
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
  button.addEventListener("click", () => {
    hideButton();
    explain(text, context, rect);
  });
  shadow.appendChild(button);
}

function hideButton() {
  if (button) button.remove();
  button = null;
}

let card = null;
let current = null;

function hideCard() {
  if (card) card.remove();
  card = null;
}

function showCard(rect) {
  hideCard();

  card = document.createElement("section");
  card.className = "card";
  card.style.left = rect.left + window.scrollX + "px";
  card.style.top = rect.bottom + window.scrollY + 10 + "px";
  card.innerHTML = `
    <h2 class="headword"><span class="swash"></span></h2>
    <p class="kind"></p>
    <p class="simple">Thinking...</p>
    <div class="more"></div>
  `;

  shadow.appendChild(card);
}

function fillCard(f) {
  if (!card) return;
  card.querySelector(".swash").textContent = f.term || current.text;
  const full = f.full && f.full !== "-" ? "short for " + f.full : "";
  card.querySelector(".kind").textContent = [f.type, full]
    .filter(Boolean)
    .join(", ");
  const unsure = f.confidence === "low" ? "Not sure about this one. " : "";
  card.querySelector(".simple").textContent = unsure + (f.simple || "");
}

function fillMore(f) {
  const box = card && card.querySelector(".more");
  if (!box) return;

  box.textContent = "";

  const sections = [
    ["what id does", f.details],
    ["Think of it like", f.analogy],
    ["For example", f.example],
    ["See also", f.related],
  ];

  for (const [title, value] of sections) {
    if (!value) continue;

    const p = document.createElement("p");
    const label = document.createElement("span");

    label.className = "label";
    label.textContent = title;
    p.append(label, value);
    box.append(p);
  }
}

document.addEventListener("mousedown", (e) => {
  if (e.composedPath().includes(host)) return;
  hideButton();
  hideCard();
});

async function askNano(system, user, onText) {
  const availability = await LanguageModel.availability();
  if (availability !== "available")
    throw new Error(`Gemini Nano is ${availability}.`);

  const session = await LanguageModel.create({
    initialPrompts: [{ role: "system", content: system }],
    expectedInputs: [{ type: "text", language: ["en"] }],
    expectedOutputs: [{ type: "text", language: ["en"] }],
  });

  let full = "";
  for await (const chunk of session.promptStreaming(user)) {
    full += chunk;
    onText(full);
  }
  session.destroy();
  return full;
}

async function explain(text, context, rect) {
  current = { text, fields: null };
  showCard(rect);

  try {
    const user = `Selection: "${text}"\nSurrounding text: "${context}"\nExplain the selection.`;
    const full = await askNano(SYSTEM_BRIEF, user, (t) =>
      fillCard(MyScholium.parse(t)),
    );

    current.fields = MyScholium.parse(full);

    const more = document.createElement("button");

    more.className = "more-btn";
    more.textContent = "Explain more";
    more.addEventListener("click", () => {
      more.remove();
      explainMore();
    });
    card.querySelector(".more").append(more);
  } catch (error) {
    if (card)
      card.querySelector(".simple").textContent =
        `Couldn't get an explanation: ${error.message}`;
  }
}

async function explainMore() {
  const f = current.fields;
  const user = `Term "${f.term || current.text}"\nShort explanation already shown: "${f.simple}"\nAdd more detail.`;

  try {
    await askNano(SYSTEM_MORE, user, (t) => fillMore(MyScholium.parse(t)));
  } catch (error) {
    if (card)
      card.querySelector(".more").textContent =
        `Couldn't add more detail: ${error.message}`;
  }
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

document.addEventListener("mousedown", (e) => {
  if (e.composedPath().includes(host)) return;
  hideButton();
  hideCard();
});
