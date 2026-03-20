/**
 * THE ALL-IN-ONE COMMANDS FILE
 * Purpose: Handle all slash commands (Mod, Fun, Util) in a single place.
 */

export const handleCommand = (message, user) => {
  // 1. Setup - split the message into command name and arguments
  const args = message.slice(1).trim().split(/\s+/);
  const command = args.shift().toLowerCase();
  
  // Get user power level (0 = Guest, 50 = Mod, 100 = Admin)
  const power = user.powerLevel || 0;

  // 2. The Command Router
  switch (command) {
    
    // --- MODERATION COMMANDS ---
    case "kick":
      if (power < 50) return { error: "You don't have the power to kick!" };
      if (!args[0]) return { error: "Please specify a user: /kick @username" };
      return {
        content: `👢 **${args[0]}** was kicked by ${user.username}.`,
        color: "#ff4757"
      };

    case "ban":
      if (power < 100) return { error: "Only Admins can use /ban." };
      if (!args[0]) return { error: "Please specify a user to ban." };
      return {
        content: `🚫 **${args[0]}** was hit by the Ban Hammer!`,
        color: "#ff0000"
      };

    case "clear":
      if (power < 50) return { error: "You can't clear messages here." };
      const amount = parseInt(args[0]) || 10;
      return {
        content: `🧹 Deleted **${amount}** messages.`,
        color: "#ffffff"
      };

    // --- UTILITY COMMANDS ---
    case "help":
      return {
        content: "📜 **Discord Clone Commands**",
        detail: "Mod: /kick, /ban, /clear \nFun: /roll, /flip, /echo \nUtil: /whois, /ping",
        color: "#7289da"
      };

    case "whois":
      const target = args[0] || user.username;
      return {
        content: `👤 **User Profile: ${target}**`,
        detail: `Status: Online | Power: ${power}`,
        color: "#1e90ff"
      };

    case "ping":
      return {
        content: "🏓 Pong!",
        detail: `Latency: ${Math.floor(Math.random() * 50) + 10}ms`,
        color: "#2ed573"
      };

    // --- FUN COMMANDS ---
    case "roll":
      const sides = parseInt(args[0]) || 6;
      const rollResult = Math.floor(Math.random() * sides) + 1;
      return {
        content: `🎲 **${user.username}** rolled a **${rollResult}**`,
        detail: `Dice type: d${sides}`,
        color: "#2ed573"
      };

    case "flip":
      const coin = Math.random() > 0.5 ? "Heads" : "Tails";
      return {
        content: `🪙 It's **${coin}**!`,
        color: "#eccc68"
      };

    case "echo":
      const text = args.join(" ");
      if (!text) return { error: "What should I say? /echo hello" };
      return {
        content: text,
        color: "#747d8c"
      };

    // --- DEFAULT (UNKNOWN) ---
    default:
      return { error: `I don't know the command "/${command}". Try /help.` };
  }
};
