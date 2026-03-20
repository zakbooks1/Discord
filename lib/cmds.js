// lib/cmds.js

export const handleCommand = (message, user) => {
  const args = message.slice(1).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  const power = user.powerLevel || 0;

  switch (command) {
    case "kick":
      if (power < 50) return { error: "❌ You don't have Moderator permissions." };
      return { content: `👢 **${args[0] || "User"}** was kicked.`, color: "#ff4757" };

    case "ban":
      if (power < 100) return { error: "❌ Admin strictly required for bans." };
      return { content: `🚫 **${args[0] || "User"}** was banned.`, color: "#ff0000" };

    case "help":
      return { 
        content: "📜 **Zakcord Commands**", 
        detail: "Mod: /kick, /ban, /clear | Fun: /roll, /flip, /echo", 
        color: "#7289da" 
      };

    case "roll":
      const sides = parseInt(args[0]) || 6;
      const roll = Math.floor(Math.random() * sides) + 1;
      return { content: `🎲 Rolled a **${roll}** (d${sides})`, color: "#2ed573" };

    case "flip":
      const coin = Math.random() > 0.5 ? "Heads" : "Tails";
      return { content: `🪙 It's **${coin}**!`, color: "#eccc68" };

    case "echo":
      return { content: args.join(" ") || "...", color: "#747d8c" };

    case "ping":
      return { content: "🏓 Pong!", color: "#2ed573" };

    default:
      return { error: `Unknown command: /${command}. Type /help` };
  }
};
