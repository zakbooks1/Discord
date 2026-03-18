"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  const [tempPfp, setTempPfp] = useState("");

  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const ADMIN_KEY = "67man76"; // Your New Password

  const channels = [{ id: "general", icon: "#" }, { id: "media", icon: "📸" }, { id: "gaming", icon: "🎮" }];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v7-final");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Username required");
    
    const cleanPass = tempPass.trim(); // No lowercase force, case-sensitive as requested
    const isAdm = cleanPass === ADMIN_KEY;
    
    const pfpUrl = tempPfp.trim() || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${tempName}`;

    const data = { name: tempName, isAdmin: isAdm, pass: cleanPass, pfp: pfpUrl };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("chat-v7-final", JSON.stringify(data));
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (imgBase64 = null) => {
    if (!text.trim() && !imgBase64) return;
    
    if (text.startsWith("/clear") && user.isAdmin) {
      await fetch("/api/messages", {
        method: "DELETE",
        headers: { "admin-pass": user.pass },
        body: JSON.stringify({ server: activeServer, clearAll: true }),
      });
      setText(""); loadData(); return;
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, user: user.name, isAdmin: user.isAdmin, 
        pfp: user.pfp, image: imgBase64, server: activeServer 
      }),
    });

    setText("");
    loadData();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => send(reader.result);
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h2 style={{ color: "white", textAlign: "center" }}>Discord Clone</h2>
          <input placeholder="Username" autoCapitalize="none" autoCorrect="off" onChange={e => setTempName(e.target.value)} style={styles.input} />
          <input placeholder="PFP Image URL (Optional)" autoCapitalize="none" onChange={e => setTempPfp(e.target.value)} style={styles.input} />
          <input placeholder="Admin Password" type="password" autoCapitalize="none" onChange={e => setTempPass(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} style={styles.loginBtn}>Join Server</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.side1}>
        <div style={styles.sCircActive}>D</div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.logout}>EXIT</button>
      </div>

      <div style={styles.side2}>
        <div style={styles.sHead}>TEXT CHANNELS</div>
        {channels.map(chan => (
          <div key={chan.id} onClick={() => setActiveServer(chan.id)} style={activeServer === chan.id ? styles.cActive : styles.cInactive}>
            {chan.icon} {chan.id}
          </div>
        ))}
      </div>

      <div style={styles.main}>
        <div style={styles.mHead}>
          # {activeServer} {user.isAdmin && <span style={styles.adminBadge}>👑 ADMIN</span>}
        </div>

        <div style={styles.msgList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.mRow}>
              <img src={m.pfp} style={styles.mAv} alt="avatar" />
              <div style={{ flex: 1 }}>
                <div style={styles.mMeta}>
                  <span style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  <span style={styles.mDate}>{new Date(m.date).toLocaleTimeString()}</span>
                </div>
                {m.text && <div style={styles.mText}>{m.text}</div>}
                {m.image && <img src={m.image} style={styles.postedImg} alt="upload" />}
              </div>
              {user.isAdmin && <button onClick={async () => {
                await fetch("/api/messages", {
                  method: "DELETE",
                  headers: { "admin-pass": user.pass },
                  body: JSON.stringify({ id: m._id, server: activeServer }),
                });
                loadData();
              }} style={styles.del}>×</button>}
            </div>
          ))}
        </div>

        <div style={styles.inWrap}>
          <div style={styles.inputContainer}>
            <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFile} />
            <button onClick={() => fileInputRef.current.click()} style={styles.plusBtn}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={styles.chatIn} placeholder={`Message #${activeServer}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" },
  side1: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "12px" },
  sCircActive: { width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  logout: { marginTop: "auto", background: "#ed4245", color: "white", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", fontSize: "10px", fontWeight: "bold" },
  side2: { width: "240px", backgroundColor: "#2b2d31", padding: "12px" },
  sHead: { padding: "10px", fontSize: "12px", fontWeight: "bold", color: "#949ba4", letterSpacing: "1px" },
  cActive: { padding: "10px 12px", backgroundColor: "#3f4147", borderRadius: "4px", color: "white", cursor: "pointer", marginBottom: "2px" },
  cInactive: { padding: "10px 12px", color: "#80848e", cursor: "pointer", transition: "0.2s" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  mHead: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #26272d", fontWeight: "bold", gap: "10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" },
  adminBadge: { fontSize: "10px", background: "#f1c40f", color: "black", padding: "2px 6px", borderRadius: "4px" },
  msgList: { flex: 1, overflowY: "auto", padding: "20px" },
  mRow: { display: "flex", gap: "16px", marginBottom: "24px" },
  mAv: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#4e5058" },
  mMeta: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "2px" },
  mDate: { fontSize: "12px", color: "#949ba4" },
  mText: { color: "#dbdee1", lineHeight: "1.4" },
  postedImg: { maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", marginTop: "10px", border: "1px solid #444" },
  inWrap: { padding: "0 20px 24px 20px" },
  inputContainer: { display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" },
  plusBtn: { background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold", fontSize: "18px", color: "#313338" },
  chatIn: { flex: 1, padding: "14px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" },
  del: { background: "none", border: "none", color: "#ed4245", cursor: "pointer", fontSize: "20px", opacity: "0.6" },
  loginPage: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "40px", borderRadius: "8px", width: "400px", display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 8px 16px rgba(0,0,0,0.3)" },
  input: { padding: "14px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "14px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }
};
