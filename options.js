const $ = (id) => document.getElementById(id);

async function load() {
  const { settings } = await chrome.storage.local.get("settings");
  const active = settings?.activeProfileId === "custom" ? "custom" : "nano";

  document.querySelector(`input[value="${active}"]`).checked = true;

  const custom = settings?.profiles?.find((p) => p.id === "custom");

  if (custom) {
    $("base").value = custom.baseUrl;
    $("model").value = custom.value;
    $("key").value = custom.apiKey || "";
  }

  $("save").addEventListener("click", async () => {
    const settings = {
      activeProfileId: document.querySelector('input[name="engine"]:checked')
        .value,
      profiles: [
        { id: "nano", kind: "nano", name: "Gemini Nano (built-in)" },
        {
          id: "custom",
          kind: "openai",
          name: "Custom",
          baseUrl: $("base").value.trim().replace(/\/+$/, ""),
          model: $("model").value.trim(),
          apiKey: $("key").value.trim(),
        },
      ],
    };

    await chrome.storage.local.set({ settings });
    $("status").textContent = "Saved";
  });
}

load();
