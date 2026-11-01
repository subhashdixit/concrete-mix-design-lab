import { trialMix, LIMITS } from "./engine.js";
import { $, announce, download } from "./ui.js";
let result;
function run(event) {
  event?.preventDefault();
  try {
    result = trialMix(
      Object.fromEntries(
        Object.keys(LIMITS).map((k) => [k, Number($(k).value)]),
      ),
    );
    $("volume-bars").replaceChildren();
    for (const [name, value] of Object.entries(result.volumes)) {
      const p = document.createElement("p"),
        meter = document.createElement("meter");
      p.textContent = `${name}: ${(value * 100).toFixed(2)}% volume `;
      meter.max = 1;
      meter.value = value;
      meter.setAttribute("aria-label", name + " volume fraction");
      p.append(meter);
      $("volume-bars").append(p);
    }
    const table = document.createElement("table");
    for (const [name, value] of Object.entries(result.batch)) {
      const tr = document.createElement("tr"),
        a = document.createElement("th"),
        b = document.createElement("td");
      a.textContent = name;
      b.textContent = value.toFixed(3) + " kg per selected batch";
      tr.append(a, b);
      table.append(tr);
    }
    $("results").replaceChildren(table);
    $("export").disabled = false;
    announce(
      `Absolute volumes sum to ${result.volumeSum.toFixed(6)} m³ per m³. Batch masses include moisture correction; lab verification is required.`,
    );
  } catch (error) {
    result = null;
    $("export").disabled = true;
    announce(error.message);
  }
}
$("mix-form").addEventListener("submit", run);
$("export").addEventListener("click", () => {
  if (result)
    download(
      "trial-mix.json",
      JSON.stringify(result, null, 2),
      "application/json",
    );
});
run();
