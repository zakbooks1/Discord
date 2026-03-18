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
  const [isAnnounceMode, setIsAnnounceMode] = useState(false);
  const scrollRef = useRef(null);

  const ADMIN_KEY = "67bits67"; 

  // List of your sub-servers/channels
  const channels = [
    { id: "general", icon: "#" },
    { id: "gaming", icon: "🎮" },
    { id: "announcements", icon: "📢" },
    { id: "coding", icon: "💻" }
  ];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v4");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Username required");
    const isAdm = tempPass.toLowerCase() === ADMIN_KEY;
    const data = { name: tempName, isAdmin: isAdm, pass: tempPass.toLowerCase() };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("chat-v4", JSON.stringify(data));
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.error("Load failed"); }
  };

  // Re-run this whenever activeServer changes
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
      body: JSON.stringify({ 
        text, user: user.name, isAdmin: user.isAdmin, 
        isAnnouncement: isAnnounceMode, server: activeServer 
      }),
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
          <h2 style={{ color: "white", textAlign: "center" }}>Discord Clone</h2>
          <input placeholder="Username" autoCapitalize="none" onChange={e => setTempName(e.target.value)} style={styles.input} />
          <input placeholder="Admin Pass" type="password" autoCapitalize="none" onChange={e => setTempPass(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} style={styles.loginBtn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Sidebar 1: Static Icons */}
      <div style={styles.side1}>
        <div style={styles.sCircActive}>D</div>
        <div style={styles.divider} />
        <div style={styles.sCirc}>+</div>
      </div>

      {/* Sidebar 2: Channel List */}
      <div style={styles.side2}>
        <div style={styles.sHead}>SERVER CHANNELS</div>
        {channels.map(chan => (
          <div 
            key={chan.id} 
            onClick={() => setActiveServer(chan.id)} 
            style={activeServer === chan.id ? styles.cActive : styles.cInactive}
          >
            <span style={{color: "#80848e", marginRight: "8px"}}>{chan.icon}</span> 
            {chan.id}
          </div>
        ))}
        <button onClick={() => {localStorage.removeItem("chat-v4"); window.location.reload();}} style={styles.logout}>Logout</button>
      </div>

      {/* Main Chat */}
      <div style={styles.main}>
        <div style={styles.mHead}>
          <span># {activeServer}</span>
          {user.isAdmin && (
            <label style={{ fontSize: "11px", color: isAnnounceMode ? "#f1c40f" : "#8e9297", cursor: "pointer" }}>
              <input type="checkbox" checked={isAnnounceMode} onChange={e => setIsAnnounceMode(e.target.checked)} />
              ANNOUNCE
            </label>
          )}
        </div>

        <div style={styles.msgList} ref={scrollRef}>
          {messages.length === 0 && <div style={{color: "#80848e", textAlign: "center", marginTop: "20px"}}>No messages in #{activeServer} yet.</div>}
          {messages.map((m, i) => (
            <div key={i} style={{ ...styles.mRow, borderLeft: m.isAnnouncement ? "4px solid #f1c40f" : "none", backgroundColor: m.isAnnouncement ? "rgba(241, 196, 15, 0.05)" : "transparent" }}>
              <div style={styles.mAv}>{m.user?.[0].toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.mMeta}>
                  <span style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  <span style={styles.mDate}>{new Date(m.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={styles.mText}>{m.text}</div>
              </div>
              {user.isAdmin && <button onClick={() => deleteMsg(m._id)} style={styles.del}>×</button>}
            </div>
          ))}
        </div>

        <div style={styles.inWrap}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                 style={styles.chatIn} placeholder={`Message #${activeServer}`} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" },
  side1: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "8px" },
  sCircActive: { width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" },
  sCirc: { width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#313338", color: "#23a559", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
  divider: { width: "32px", height: "2px", backgroundColor: "#35363c", margin: "4px 0" },
  side2: { width: "240px", backgroundColor: "#2b2d31", display: "flex", flexDirection: "column", padding: "8px" },
  sHead: { padding: "12px", fontSize: "12px", fontWeight: "bold", color: "#949ba4" },
  cActive: { padding: "8px 12px", backgroundColor: "#3f4147", borderRadius: "4px", color: "white", cursor: "pointer", marginBottom: "2px" },
  cInactive: { padding: "8px 12px", color: "#80848e", cursor: "pointer", marginBottom: "2px", borderRadius: "4px" },
  logout: { marginTop: "auto", padding: "10px", backgroundColor: "#ed4245", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  mHead: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #26272d", justifyContent: "space-between", fontWeight: "bold" },
  msgList: { flex: 1, overflowY: "auto", padding: "20px" },
  mRow: { display: "flex", gap: "16px", padding: "8px 16px" },
  mAv: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#eb459e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  mMeta: { display: "flex", alignItems: "center", gap: "8px" },
  mDate: { fontSize: "12px", color: "#949ba4" },
  mText: { color: "#dbdee1", marginTop: "2px" },
  inWrap: { padding: "0 20px 24px 20px" },
  chatIn: { width: "100%", padding: "11px", borderRadius: "8px", border: "none", backgroundColor: "#383a40", color: "#dbdee1", outline: "none" },
  del: { background: "none", border: "none", color: "#ed4245", cursor: "pointer", fontSize: "18px" },
  loginPage: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "32px", borderRadius: "8px", width: "350px", display: "flex", flexDirection: "column", gap: "16px" },
  input: { padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "12px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }
};
