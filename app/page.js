"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Login Inputs
  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");

  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("chat-user");
    if (saved) {
      setUser(JSON.parse(saved));
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Enter a name");
    const userData = { 
      name: tempName, 
      isAdmin: tempPass === "your_secret_admin_pass", // Same as backend
      pass: tempPass 
    };
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("chat-user", JSON.stringify(userData));
  };

  const loadData = async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data.reverse());
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const send = async () => {
    if (!text) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user: user.name, isAdmin: user.isAdmin }),
    });
    setText("");
    loadData();
  };

  const deleteMsg = async (id) => {
    await fetch("/api/messages", {
      method: "DELETE",
      headers: { "admin-pass": user.pass },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginBox}>
          <h3>Welcome Back!</h3>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={styles.loginInput} />
          <input placeholder="Admin Password (Optional)" type="password" onChange={e => setTempPass(e.target.value)} style={styles.loginInput} />
          <button onClick={handleLogin} style={styles.loginBtn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.chatArea}>
        <div style={styles.header}># general-chat {user.isAdmin && "(ADMIN)"}</div>
        <div style={styles.messageList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.messageRow}>
              <div style={styles.avatar}>{m.user?.[0]}</div>
              <div style={{ flex: 1 }}>
                <span style={styles.username}>{m.user} {m.isAdmin && "🛡️"}</span>
                <div style={styles.messageText}>{m.text}</div>
              </div>
              {user.isAdmin && (
                <button onClick={() => deleteMsg(m._id)} style={styles.deleteBtn}>Delete</button>
              )}
            </div>
          ))}
        </div>
        <div style={styles.inputWrapper}>
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && send()}
            style={styles.mainInput} 
            placeholder="Type a message..."
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1" },
  loginOverlay: { display: "flex", height: "100vh", justifyContent: "center", alignItems: "center", backgroundColor: "#1e1f22" },
  loginBox: { backgroundColor: "#313338", padding: "40px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px", width: "300px" },
  loginInput: { padding: "10px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "10px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  header: { height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #26272d", fontWeight: "bold" },
  messageList: { flex: 1, overflowY: "auto", padding: "20px" },
  messageRow: { display: "flex", gap: "15px", marginBottom: "20px", alignItems: "center" },
  avatar: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#5865f2", display: "flex", justifyContent: "center", alignItems: "center" },
  username: { fontWeight: "bold", fontSize: "14px" },
  messageText: { marginTop: "4px" },
  inputWrapper: { padding: "20px", backgroundColor: "#313338" },
  mainInput: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#383a40", color: "white", outline: "none" },
  deleteBtn: { backgroundColor: "transparent", color: "#ff4747", border: "1px solid #ff4747", borderRadius: "4px", padding: "2px 8px", cursor: "pointer", fontSize: "10px" }
};
