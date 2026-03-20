// Discord/lib/cmds.js

export const handleCommand = (message, user = { username: "Guest", powerLevel: 0 }) => {
  const args = message.slice(1).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  const power = user.powerLevel || 0;

  switch (command) {
    case "kick":
      if (power < 50) return { error: "Lower your voice! You aren't a Mod." };
      return { content: `👢 **${args[0] || "Someone"}** was kicked.`, color: "#ff4757" };

    case "ban":
      if (power < 100) return { error: "Only Admins can swing the hammer." };
      return { content: `🚫 **${args[0] || "Someone"}** was banned.`, color: "#ff0000" };

    case "help":
      return { 
        content: "📜 **Commands**", 
        detail: "/kick, /ban, /roll, /flip, /whois, /ping", 
        color: "#7289da" 
      };

    case "roll":
      const sides = parseInt(args[0]) || 6;
      return { content: `🎲 Rolled a **${Math.floor(Math.random() * sides) + 1}**`, color: "#2ed573" };

    case "whois":
      return { content: `👤 **User:** ${args[0] || user.username}`, detail: `Rank: ${power >= 100 ? "Admin" : "Member"}`, color: "#1e90ff" };

    case "ping":
      return { content: "🏓 Pong!", color: "#2ed573" };

    default:
      return { error: `Unknown command: /${command}` };
  }
};
