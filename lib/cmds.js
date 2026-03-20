export const runCmd = (text, user) => {
  if (!text.startsWith("/")) return null;
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();
  const suffix = args.slice(1).join(" ");

  // --- Admin/Staff Commands ---
  if (cmd === "/announce") return { action: "announce", adminAction: true, text: suffix };
  if (cmd === "/clear") return { action: "clear", adminAction: true };
  if (cmd === "/kick") return { text: `User ${args[1]} has been kicked.`, type: "system" };

  // --- Utility & Fun Commands ---
  if (cmd === "/shrug") return { text: "¯\\_(ツ)_/¯", type: "msg" };
  if (cmd === "/dice") return { text: `🎲 Rolled a ${Math.floor(Math.random() * 6) + 1}!`, type: "msg" };
  if (cmd === "/flip") return { text: `🪙 It's ${Math.random() > 0.5 ? "Heads" : "Tails"}!`, type: "msg" };
  if (cmd === "/calc") {
    try {
      const result = eval(suffix.replace(/[^-()\d/*+.]/g, ''));
      return { text: `🧮 Result: ${result}`, type: "msg" };
    } catch { return { text: "Error: Invalid math.", type: "msg" }; }
  }
  if (cmd === "/me") return { text: `* ${user.name} ${suffix} *`, type: "msg" };
  
  return null;
};
