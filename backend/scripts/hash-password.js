const bcrypt = require("bcryptjs");
const readline = require("node:readline");

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.error("Ejecuta este comando en una terminal interactiva para ocultar la contraseña.");
  process.exit(1);
}
process.stdout.write("Contraseña nueva (mínimo 12 caracteres): ");
process.stdin.setRawMode(true);
process.stdin.resume();
let password = "";
process.stdin.on("data", async (chunk) => {
  const key = chunk.toString();
  if (key === "\u0003") process.exit(1);
  if (key === "\r" || key === "\n") {
    process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n");
    if (password.length < 12) { console.error("Usa al menos 12 caracteres."); process.exitCode = 1; return; }
    console.log(await bcrypt.hash(password, 12)); password = ""; return;
  }
  if (key === "\u007f") password = password.slice(0, -1); else if (key.length === 1) password += key;
});
