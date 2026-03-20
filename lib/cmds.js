export const processCommand = (text, user, activeServer) => {
  if (!text.startsWith("/")) return null;
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  const adminCmds = {
    "/clear": { action: "clear", adminAction: true },
    "/announce": { action: "announce", adminAction: true, text: args.slice(1).join(" ") },
  };

  const funCmds = {
    "/shrug": "¯\\_(ツ)_/¯",
    "/dice": `🎲 Rolled: ${Math.floor(Math.random() * 6) + 1}`,
  };

  if (adminCmds[cmd]) return { ...adminCmds[cmd], type: "admin" };
  if (funCmds[cmd]) return { text: funCmds[cmd], type: "msg" };

  return null;
};
