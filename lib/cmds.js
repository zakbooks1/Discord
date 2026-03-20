export const runCmd = (text) => {
  if (!text.startsWith("/")) return null;
  const args = text.split(" ");
  const cmd = args[0].toLowerCase();

  if (cmd === "/announce") return { action: "announce", adminAction: true, text: args.slice(1).join(" ") };
  if (cmd === "/clear") return { action: "clear", adminAction: true };
  if (cmd === "/shrug") return { text: "¯\\_(ツ)_/¯", type: "msg" };
  
  return null;
};
