globalThis.MyScholium = globalThis.MyScholium || {};

MyScholium.parse = function parse(text) {
  const fields = {};
  let current = null;

  for (const line of String(text).split("\n")) {
    const m = line.match(
      /^\s*\**\s*(TERM|TYPE|FULL|CONFIDENCE|SIMPLE|DETAILS|ANALOGY|EXAMPLE|RELATED)\s*\**\s*:\s*(.*)$/i,
    );

    if (m) {
      current = m[1].toLowerCase();
      fields[current] = m[2].trim();
    } else if (current && line.trim()) {
      fields[current] += "\n" + line.trim(); // a value can continue on the next line
    }
  }

  return fields;
};
