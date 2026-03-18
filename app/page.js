"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  const scrollRef = useRef(null);

  const APP_ADMIN_PASS = "67bits67"; // MUST match the backend

  const servers = [
    { id: "general", name: "G", color: "#5865f2" },
    { id: "gaming", name: "🎮", color: "#3ba55c" },
    { id: "coding", name: "💻", color: "#eb459e" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("chat-session");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Please enter a username");
    const isActuallyAdmin = tempPass === APP_ADMIN_PASS;
    const userData = { name: tempName, isAdmin: isActuallyAdmin, pass: tempPass };
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("chat-session", JSON.stringify(userData));
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.error("Refresh failed"); }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user: user.name, isAdmin: user.isAdmin, server: activeServer }),
    });
    setText("");
    loadData();
  };

  const deleteMsg = async (id) => {
    await fetch("/api/messages", {
      method: "DELETE",
      headers: { "admin-pass": user.pass, "Content-Type": "application/json" },
      body: JSON.stringify({ id, server: activeServer }),
    });
    loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginBg}>
        <div style={styles.loginCard}>
          <h2 style={{ textAlign: "center", color: "white" }}>Discord Clone</h2>
          <p style={{ color: "#b5bac1", textAlign: "center", fontSize: "14px" }}>Login to start chatting</p>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={styles.loginInput} />
          <input placeholder="Admin Password (Optional)" type="password" onChange={e => setTempPass(e.target.value)} style={styles.loginInput} />
          <button onClick={handleLogin} style={styles.loginBtn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      {/* Server Column */}
      <div style={styles.serverBar}>
        {servers.map(s => (
          <div key={s.id} onClick={() => setActiveServer(s.id)} 
               style={{ ...styles.sCircle, backgroundColor: s.color, borderRadius: activeServer === s.id ? "15px" : "50%" }}>
            {s.name}
          </div>
        ))}
      </div>

      {/* Channel Column */}
      <div style={styles.channelBar}>
        <div style={styles.sTitle}>My Servers</div>
        <div style={styles.cItemActive}># {activeServer}</div>
        <div style={styles.cItem}># rules</div>
        <div style={styles.cItem}># off-topic</div>
      </div>

      {/* Chat Column */}
      <div style={styles.chatBox}>
        <div style={styles.chatHeader}>
          <span># {activeServer}</span>
          {user.isAdmin && <span style={styles.adminTag}>ADMIN ACTIVE</span>}
        </div>
        
        <div style={styles.msgArea} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.msgRow}>
              <div style={styles.msgAvatar}>{m.user?.[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.msgTop}>
                  <span style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  <span style={styles.msgDate}>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={styles.msgText}>{m.text}</div>
              </div>
              {user.isAdmin && <button onClick={() => deleteMsg(m._id)} style={styles.del}>×</button>}
            </div>
          ))}
        </div>

        <div style={styles.inputWrap}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                 style={styles.chatIn} placeholder={`Message #${activeServer}`} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" },
  serverBar: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" },
  sCircle: { width: "48px", height: "48px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", transition: "0.2s" },
  channelBar: { width: "240px", backgroundColor: "#2b2d31" },
  sTitle: { padding: "15px", fontWeight: "bold", borderBottom: "1px solid #232428" },
  cItemActive: { padding: "8px 10px", margin: "2px 8px", backgroundColor: "#3f4147", borderRadius: "4px", color: "white" },
  cItem: { padding: "8px 10px", margin: "2px 8px", color: "#80848e", cursor: "pointer" },
  chatBox: { flex: 1, display: "flex", flexDirection: "column" },
  chatHeader: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold", justifyContent: "space-between" },
  adminTag: { fontSize: "10px", backgroundColor: "#f1c40f", color: "black", padding: "2px 8px", borderRadius: "4px" },
  msgArea: { flex: 1, overflowY: "auto", padding: "20px" },
  msgRow: { display: "flex", gap: "15px", marginBottom: "15px" },
  msgAvatar: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  msgTop: { display: "flex", gap: "10px", alignItems: "center" },
  msgDate: { fontSize: "12px", color: "#949ba4" },
  msgText: { marginTop: "2px", color: "#dbdee1" },
  inputWrap: { padding: "0 20px 24px 20px" },
  chatIn: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#383a40", color: "white", outline: "none" },
  del: { background: "none", border: "none", color: "#ed4245", fontSize: "20px", cursor: "pointer" },
  loginBg: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "30px", borderRadius: "8px", width: "350px", display: "flex", flexDirection: "column", gap: "15px" },
  loginInput: { padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "12px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }
};
