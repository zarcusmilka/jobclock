import { build } from 'vite';

async function run() {
  console.log("Starte Vite Build...");
  try {
    await build();
    console.log("Build erfolgreich! Erzwinge Prozessende zur Vermeidung von Hängern.");
    process.exit(0);
  } catch (err) {
    console.error("Build fehlgeschlagen:", err);
    process.exit(1);
  }
}

run();
