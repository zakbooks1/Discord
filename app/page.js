"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    } catch (e) { console.log("Load error"); }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const send = async () => {
    if (!text || !username) return alert("Fill in Username and Message!");

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // CRITICAL LINE
      body: JSON.stringify({ 
        text: text, 
        user: username // Sends the username state
      }),
    });

    if (response.ok) {
      setText("");
      loadData();
    }
  };

  return (
    <div style={{ padding: "20px", background: "#111", color: "white", minHeight: "100vh" }}>
      <h2>Discord Clone (MongoDB)</h2>
      
      <input 
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ padding: "10px", marginBottom: "10px", borderRadius: "5px", width: "200px" }}
      />

      <div style={{ height: "300px", overflowY: "auto", background: "#222", padding: "10px", borderRadius: "10px" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #333", paddingBottom: "5px" }}>
            <span style={{ color: "#0070f3", fontWeight: "bold" }}>{m.user}: </span>
            <span>{m.text}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px" }}>
        <input 
          placeholder="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          style={{ padding: "10px", width: "70%", borderRadius: "5px", color: "black" }}
        />
        <button onClick={send} style={{ padding: "10px", marginLeft: "5px" }}>Send</button>
      </div>
    </div>
  );
}
