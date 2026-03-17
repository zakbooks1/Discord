"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const load = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!text) return;
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    setText("");
    load();
  };

  return (
    <div style={{ background: "#111", color: "white", minHeight: "100vh", padding: "20px" }}>
      <h1>MongoDB Chat</h1>
      <div style={{ marginBottom: "20px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ background: "#222", padding: "10px", margin: "5px 0", borderRadius: "5px" }}>
            {m.text}
          </div>
        ))}
      </div>
      <input 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        style={{ padding: "10px", borderRadius: "5px", border: "none", width: "70%" }}
        placeholder="Type a message..."
      />
      <button onClick={send} style={{ padding: "10px 20px", marginLeft: "10px", cursor: "pointer" }}>
        Send
      </button>
    </div>
  );
}
