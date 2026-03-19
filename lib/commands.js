export const handleCommand = (text, user, activeServer) => {
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  // Basic commands that don't need backend admin checks
  if (cmd === "/shrug") return { text: "¯\\_(ツ)_/¯", type: "msg" };
  if (cmd === "/dice") return { text: `🎲 Rolled: ${Math.floor(Math.random() * 6) + 1}`, type: "msg" };

  // Admin-only commands (these flag the backend to check the whitelist)
  if (cmd === "/announce") {
    return { 
      action: "announce", 
      adminAction: true, 
      text: args.slice(1).join(" "), 
      type: "cmd" 
    };
  }

  if (cmd === "/clear") {
    return { 
      action: "clear", 
      adminAction: true, 
      type: "cmd" 
    };
  }

  if (cmd === "/ban") {
    return { 
      action: "ban", 
      adminAction: true, 
      targetUid: args[1], 
      type: "cmd" 
    };
  }

  return null; // Not a recognized command
};
