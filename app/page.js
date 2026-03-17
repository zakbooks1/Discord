"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");

  // 1. Load data once on start
  const loadData = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) {
      console.error("Failed to load");
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. Send and then Trigger Refresh
  const send = async () => {
    if (!text || !username) return alert("Enter a username and message!");
    
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, 
        user: username // Sending the username too
      }),
    });

    setText("");
    loadData(); // This is the "Update only when you send" logic
  };

  return (
    <div style={{ padding: 20, background: "#111", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h1>Chat App</h1>
      
      {/* Username Input */}
      <input 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        style={{ padding: 10, borderRadius: 5, marginBottom: 10, width: "200px" }}
        placeholder="Your Username"
      />

      <div style={{ margin: "20px 0", maxHeight: "400px", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ background: "#222", padding: "10px 15px", marginBottom: 8, borderRadius: 10 }}>
            <strong style={{ color: "#3eaf7c" }}>{m.user || "Anonymous"}:</strong> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1, padding: 12, borderRadius: 5, border: "none" }}
          placeholder="Type a message..."
        />
        <button onClick={send} style={{ padding: "10px 20px", background: "#3eaf7c", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}
