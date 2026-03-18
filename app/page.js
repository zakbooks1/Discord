"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");

  // 1. The function that fetches data
  const loadData = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) {
        // Only update state if the data actually changed to prevent flickering
        setMessages(data);
      }
    } catch (e) {
      console.error("Failed to load messages");
    }
  };

  // 2. The Auto-Refresh Logic
  useEffect(() => {
    loadData(); // Load immediately on page load

    // Check for new messages every 3 seconds (3000ms)
    const interval = setInterval(() => {
      loadData();
    }, 3000);

    // Cleanup: Stops the timer if the user leaves the page
    return () => clearInterval(interval);
  }, []);

  // 3. Send Message
  const send = async () => {
    if (!text || !username) return alert("Enter a username and message!");
    
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user: username }),
    });

    if (res.ok) {
      setText("");
      loadData(); // Refresh immediately after sending
    }
  };

  return (
    <div style={{ padding: 20, background: "#111", color: "white", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <h2>Chat Auto-Refresh: ON</h2>
      
      <input 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
        style={{ padding: 10, borderRadius: 5, marginBottom: 10, width: "200px", border: "1px solid #444" }}
        placeholder="Your Username"
      />

      <div style={{ 
        margin: "20px 0", 
        height: "400px", 
        overflowY: "auto", 
        background: "#1a1a1a", 
        padding: "15px", 
        borderRadius: "10px" 
      }}>
        {messages.map((m, i) => (
          <div key={m._id || i} style={{ background: "#222", padding: "10px", marginBottom: 8, borderRadius: 8 }}>
            <strong style={{ color: "#0070f3" }}>{m.user || "Guest"}:</strong> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ flex: 1, padding: 12, borderRadius: 5, border: "none", background: "#333", color: "white" }}
          placeholder="Type a message..."
        />
        <button onClick={send} style={{ padding: "10px 20px", background: "#0070f3", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}
