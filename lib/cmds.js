export const processCommand = (text, user, activeServer) => {
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  const adminCmds = {
    "/clear": { action: "clear", adminAction: true },
    "/announce": { action: "announce", adminAction: true, text: args.slice(1).join(" ") },
    "/ban": { action: "ban", adminAction: true, targetUid: args[1] }
  };

  const funCmds = {
    "/shrug": "¯\\_(ツ)_/¯",
    "/dice": `🎲 Rolled: ${Math.floor(Math.random() * 6) + 1}`,
    "/flip": `🪙 Coin land on: ${Math.random() > 0.5 ? "Heads" : "Tails"}`,
    "/hehehe": "bake bake bake bake bake bake"
  };

  if (adminCmds[cmd]) return { ...adminCmds[cmd], type: "admin" };
  if (funCmds[cmd]) return { text: funCmds[cmd], type: "msg" };

  return null;
};
