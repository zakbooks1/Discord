"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

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

  const send = async () => {
    if (!text) return;
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setText("");
    loadData();
  };

  return (
    <div style={{ padding: 20, background: "#111", color: "white", minHeight: "100vh" }}>
      <h1>Chat App</h1>
      <div style={{ margin: "20px 0" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ background: "#333", padding: 10, marginBottom: 5 }}>
            {m.text}
          </div>
        ))}
      </div>
      <input 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        style={{ color: "black", padding: 10 }}
        placeholder="Type here..."
      />
      <button onClick={send} style={{ padding: 10, marginLeft: 5 }}>Send</button>
    </div>
  );
}
