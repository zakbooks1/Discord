"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Login States
  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  const [tempPfp, setTempPfp] = useState("");

  const scrollRef = useRef(null);
  const ADMIN_KEY = "67guy56"; 

  const channels = [
    { id: "general", icon: "#" },
    { id: "images", icon: "📸" },
    { id: "staff-only", icon: "🔒" }
  ];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v5");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Username required");
    const isAdm = tempPass.toLowerCase() === ADMIN_KEY;
    const pfpUrl = tempPfp || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tempName}`;
    const data = { name: tempName, isAdmin: isAdm, pass: tempPass.toLowerCase(), pfp: pfpUrl };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("chat-v5", JSON.stringify(data));
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

  const runCommand = async (cmd) => {
    const parts = cmd.split(" ");
    const action = parts[0].toLowerCase();

    if (!user.isAdmin) return alert("Commands are for Admins only!");

    if (action === "/clear") {
      await fetch("/api/messages", {
        method: "DELETE",
        headers: { "admin-pass": user.pass },
        body: JSON.stringify({ server: activeServer, clearAll: true }),
      });
    } else if (action === "/kick" && parts[1]) {
      await fetch("/api/messages", {
        method: "DELETE",
        headers: { "admin-pass": user.pass },
        body: JSON.stringify({ banUser: parts[1] }),
      });
      alert(`User ${parts[1]} has been banned.`);
    }
    loadData();
  };

  const send = async (imgUrl = null) => {
    if (!text.trim() && !imgUrl) return;

    if (text.startsWith("/")) {
      runCommand(text);
      setText("");
      return;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, user: user.name, isAdmin: user.isAdmin, 
        pfp: user.pfp, image: imgUrl, server: activeServer 
      }),
    });

    if (res.status === 403) alert("You are banned from this server!");
    setText("");
    loadData();
  };

  const uploadPhoto = () => {
    const url = prompt("Paste Image URL (jpg, png, gif):");
    if (url) send(url);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h2 style={{ color: "white", textAlign: "center" }}>Join Discord</h2>
          <input placeholder="Username" autoCapitalize="none" onChange={e => setTempName(e.target.value)} style={styles.input} />
          <input placeholder="PFP URL (Optional)" onChange={e => setTempPfp(e.target.value)} style={styles.input} />
          <input placeholder="Admin Pass" type="password" onChange={e => setTempPass(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} style={styles.loginBtn}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.side1}>
        <div style={styles.sCircActive}>D</div>
        <button onClick={() => {localStorage.removeItem("chat-v5"); window.location.reload();}} style={styles.logout}>X</button>
      </div>

      <div style={styles.side2}>
        <div style={styles.sHead}>CHANNELS</div>
        {channels.map(chan => (
          <div key={chan.id} onClick={() => setActiveServer(chan.id)} style={activeServer === chan.id ? styles.cActive : styles.cInactive}>
            {chan.icon} {chan.id}
          </div>
        ))}
      </div>

      <div style={styles.main}>
        <div style={styles.mHead}># {activeServer}</div>

        <div style={styles.msgList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.mRow}>
              <img src={m.pfp} style={styles.mAv} alt="pfp" />
              <div style={{ flex: 1 }}>
                <div style={styles.mMeta}>
                  <span style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  <span style={styles.mDate}>{new Date(m.date).toLocaleTimeString()}</span>
                </div>
                {m.text && <div style={styles.mText}>{m.text}</div>}
                {m.image && <img src={m.image} style={styles.postedImg} alt="upload" />}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.inWrap}>
          <div style={styles.inputContainer}>
            <button onClick={uploadPhoto} style={styles.plusBtn}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={styles.chatIn} placeholder="Type /clear or a message..." />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" },
  side1: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" },
  sCircActive: { width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  logout: { marginTop: "auto", background: "#ed4245", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer" },
  side2: { width: "240px", backgroundColor: "#2b2d31", padding: "10px" },
  sHead: { padding: "10px", fontSize: "12px", fontWeight: "bold", color: "#949ba4" },
  cActive: { padding: "8px 12px", backgroundColor: "#3f4147", borderRadius: "4px", color: "white", cursor: "pointer", marginBottom: "2px" },
  cInactive: { padding: "8px 12px", color: "#80848e", cursor: "pointer" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  mHead: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #26272d", fontWeight: "bold" },
  msgList: { flex: 1, overflowY: "auto", padding: "20px" },
  mRow: { display: "flex", gap: "16px", marginBottom: "20px" },
  mAv: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" },
  mMeta: { display: "flex", gap: "10px", alignItems: "center" },
  mDate: { fontSize: "12px", color: "#949ba4" },
  mText: { color: "#dbdee1", marginTop: "2px" },
  postedImg: { maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "10px", border: "1px solid #444" },
  inWrap: { padding: "0 20px 24px 20px" },
  inputContainer: { display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" },
  plusBtn: { background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold", fontSize: "18px" },
  chatIn: { flex: 1, padding: "12px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" },
  loginPage: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "30px", borderRadius: "8px", width: "350px", display: "flex", flexDirection: "column", gap: "15px" },
  input: { padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "12px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }
};
