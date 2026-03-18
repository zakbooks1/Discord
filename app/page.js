const ADMIN_PASS = "67man"; // Make sure this is exactly what you type!

const handleLogin = () => {
  if (!tempName) return alert("Enter a name");
  
  // LOGIC CHECK:
  const isAdm = tempPass === ADMIN_PASS; 
  
  const userData = { 
    name: tempName, 
    isAdmin: isAdm, // If this is false, admin won't work
    pass: tempPass 
  };
  // ... rest of code 
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

  const ADMIN_PASS = "topsecret123"; // MUST MATCH BACKEND

  const servers = [
    { id: "general", name: "G", color: "#5865f2" },
    { id: "gaming", name: "🎮", color: "#3ba55c" },
    { id: "coding", name: "💻", color: "#eb459e" }
  ];

  useEffect(() => {
    const saved = localStorage.getItem("chat-user");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Enter a name");
    const isAdm = tempPass === ADMIN_PASS;
    const userData = { name: tempName, isAdmin: isAdm, pass: tempPass };
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem("chat-user", JSON.stringify(userData));
  };

  const loadData = async () => {
    const res = await fetch(`/api/messages?server=${activeServer}`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data.reverse());
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  const send = async () => {
    if (!text) return;
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
      headers: { "admin-pass": user.pass },
      body: JSON.stringify({ id, server: activeServer }),
    });
    loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Welcome Back!</h2>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={styles.loginInput} />
          <input placeholder="Admin Key (Optional)" type="password" onChange={e => setTempPass(e.target.value)} style={styles.loginInput} />
          <button onClick={handleLogin} style={styles.loginBtn}>Continue</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* Sidebar 1: Servers */}
      <div style={styles.serverSidebar}>
        {servers.map(s => (
          <div 
            key={s.id} 
            onClick={() => setActiveServer(s.id)}
            style={{ ...styles.serverCircle, backgroundColor: s.color, border: activeServer === s.id ? "2px solid white" : "none" }}
          >
            {s.name}
          </div>
        ))}
      </div>

      {/* Sidebar 2: Channels */}
      <div style={styles.channelSidebar}>
        <div style={styles.serverHeader}>My Discord</div>
        <div style={styles.channelItem}># {activeServer}</div>
        <div style={styles.channelItemInactive}># off-topic</div>
      </div>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.chatHeader}>
          <span style={{ color: "#80848e" }}>#</span> {activeServer}
          {user.isAdmin && <span style={styles.adminBadge}>ADMIN MODE</span>}
        </div>
        
        <div style={styles.messageList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.msgRow}>
              <div style={styles.msgAvatar}>{m.user?.[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.msgMeta}>
                  <span style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  <span style={styles.msgTime}>Today at {new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={styles.msgText}>{m.text}</div>
              </div>
              {user.isAdmin && <button onClick={() => deleteMsg(m._id)} style={styles.delBtn}>×</button>}
            </div>
          ))}
        </div>

        <div style={styles.inputArea}>
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyDown={e => e.key === "Enter" && send()}
            style={styles.chatInput} 
            placeholder={`Message #${activeServer}`}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" },
  serverSidebar: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" },
  serverCircle: { width: "48px", height: "48px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "18px", transition: "0.2s" },
  channelSidebar: { width: "240px", backgroundColor: "#2b2d31", display: "flex", flexDirection: "column" },
  serverHeader: { padding: "15px", fontWeight: "bold", borderBottom: "1px solid #232428", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" },
  channelItem: { padding: "8px 10px", margin: "2px 8px", backgroundColor: "#3f4147", borderRadius: "4px", color: "white", cursor: "pointer" },
  channelItemInactive: { padding: "8px 10px", margin: "2px 8px", color: "#80848e", cursor: "pointer" },
  chatArea: { flex: 1, display: "flex", flexDirection: "column" },
  chatHeader: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold", gap: "10px" },
  adminBadge: { fontSize: "10px", backgroundColor: "#f1c40f", color: "black", padding: "2px 6px", borderRadius: "4px" },
  messageList: { flex: 1, overflowY: "auto", padding: "20px" },
  msgRow: { display: "flex", gap: "16px", marginBottom: "15px", group: "hover" },
  msgAvatar: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  msgMeta: { display: "flex", alignItems: "baseline", gap: "8px" },
  msgTime: { fontSize: "12px", color: "#949ba4" },
  msgText: { color: "#dbdee1", marginTop: "2px" },
  inputArea: { padding: "0 20px 24px 20px" },
  chatInput: { width: "100%", padding: "12px", borderRadius: "8px", border: "none", backgroundColor: "#383a40", color: "white", outline: "none" },
  delBtn: { background: "none", border: "none", color: "#ed4245", fontSize: "20px", cursor: "pointer", padding: "0 10px" },
  loginPage: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "32px", borderRadius: "8px", width: "400px", boxShadow: "0 8px 16px rgba(0,0,0,0.2)" },
  loginInput: { width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { width: "100%", padding: "12px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }
};
