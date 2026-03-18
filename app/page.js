"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cmdHint, setCmdHint] = useState("");

  const chatFileRef = useRef(null);
  const scrollRef = useRef(null);
  const ADMIN_KEY = "67man76";
  
  // New Admin Commands
  const ADMIN_CMDS = ["/ban", "/unban", "/clear", "/yeet", "/clown", "/mute"];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v11");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  // Command "Auto-Correct" Helper
  useEffect(() => {
    if (user.isAdmin && text.startsWith("/")) {
      const input = text.split(" ")[0].toLowerCase();
      const match = ADMIN_CMDS.find(c => c.startsWith(input));
      setCmdHint(match && match !== input ? `Suggestion: ${match}` : "");
    } else { setCmdHint(""); }
  }, [text, user.isAdmin]);

  const send = async (img = null) => {
    let msgText = text.trim();
    if (!msgText && !img) return;

    // ADMIN COMMAND LOGIC
    if (user.isAdmin && msgText.startsWith("/")) {
      const parts = msgText.split(" ");
      const cmd = parts[0].toLowerCase();
      const target = parts[1];

      if (cmd === "/ban" && target) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminAction: true, action: "ban", target, pass: user.pass })
        });
        msgText = `🚫 Admin banned ${target}.`;
      } 
      else if (cmd === "/unban" && target) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminAction: true, action: "unban", target, pass: user.pass })
        });
        msgText = `✅ Admin unbanned ${target}.`;
        setText(""); loadData(); return;
      }
      else if (cmd === "/clear") {
        await fetch("/api/messages", { 
          method: "DELETE", 
          headers: { "admin-pass": user.pass }, 
          body: JSON.stringify({ server: activeServer, clearAll: true }) 
        });
        setText(""); loadData(); return;
      }
      else if (cmd === "/yeet") msgText = "🚀 YEET! User was tossed out of the server.";
      else if (cmd === "/mute") msgText = `🔇 ${target || "Someone"} has been muted (mentally).`;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: msgText, user: user.name, isAdmin: user.isAdmin, 
        pfp: user.pfp, image: img, server: activeServer 
      }),
    });

    if (res.status === 403) alert("YOU ARE BANNED.");
    setText("");
    loadData();
  };

  // ... (Include your handleLogin and updatePFP functions from the previous remake) ...

  return (
    <div style={styles.appFrame}>
      {/* Sidebar and Message Area code remains same as previous "Remake" version */}
      <div style={styles.mainContent}>
        <div style={styles.messageArea} ref={scrollRef}>
           {/* Message mapping code */}
        </div>

        {/* Updated Input Bar with Hint */}
        <div style={styles.inputWrapper}>
          {cmdHint && <div style={styles.hintText}>{cmdHint}</div>}
          <div style={styles.inputBox}>
            <button onClick={() => chatFileRef.current.click()} style={styles.plusBtn}>+</button>
            <input 
              value={text} 
              onChange={e => setText(e.target.value)} 
              onKeyDown={e => e.key === "Enter" && send()}
              style={styles.textInput} 
              placeholder={user.isAdmin ? "Try /ban or /clear..." : "Message..."} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // Use the same styles from the previous "Remake" response
  hintText: { 
    color: "#f1c40f", 
    fontSize: "12px", 
    marginBottom: "5px", 
    marginLeft: "45px", 
    fontWeight: "bold",
    fontStyle: "italic" 
  },
  // ... rest of styles
};
