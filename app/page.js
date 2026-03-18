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
  
  const fileInputRef = useRef(null); // Ref for the hidden file input
  const scrollRef = useRef(null);
  const ADMIN_KEY = "67boy93";

  const channels = [{ id: "general", icon: "#" }, { id: "media", icon: "🖼️" }];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v6");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Username required");
    const isAdm = tempPass.toLowerCase() === ADMIN_KEY;
    const data = { 
      name: tempName, 
      isAdmin: isAdm, 
      pass: tempPass.toLowerCase(), 
      pfp: `https://api.dicebear.com/7.x/identicon/svg?seed=${tempName}` 
    };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("chat-v6", JSON.stringify(data));
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

  const send = async (imgBase64 = null) => {
    if (!text.trim() && !imgBase64) return;

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

  // Function to handle iPad Photo Library selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      send(reader.result); // Sends the base64 string
    };
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h2 style={{ color: "white", textAlign: "center" }}>Discord Clone</h2>
          <input placeholder="Username" autoCapitalize="none" onChange={e => setTempName(e.target.value)} style={styles.input} />
          <input placeholder="Admin Pass" type="password" onChange={e => setTempPass(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} style={styles.loginBtn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.side1}>
        <div style={styles.sCircActive}>D</div>
        <button onClick={() => {localStorage.removeItem("chat-v6"); window.location.reload();}} style={styles.logout}>X</button>
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
                </div>
                {m.text && <div style={styles.mText}>{m.text}</div>}
                {m.image && <img src={m.image} style={styles.postedImg} alt="upload" />}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.inWrap}>
          <div style={styles.inputContainer}>
            {/* HIDDEN FILE INPUT */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              onChange={handleFileChange} 
            />
            {/* CLICKING THIS OPENS PHOTO LIBRARY */}
            <button onClick={() => fileInputRef.current.click()} style={styles.plusBtn}>+</button>
            
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={styles.chatIn} placeholder="Message..." />
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
  logout: { marginTop: "auto", background: "#ed4245", color: "white", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", marginBottom: "10px" },
  side2: { width: "240px", backgroundColor: "#2b2d31", padding: "10px" },
  sHead: { padding: "10px", fontSize: "12px", fontWeight: "bold", color: "#949ba4" },
  cActive: { padding: "8px 12px", backgroundColor: "#3f4147", borderRadius: "4px", color: "white", cursor: "pointer", marginBottom: "2px" },
  cInactive: { padding: "8px 12px", color: "#80848e", cursor: "pointer" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  mHead: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #26272d", fontWeight: "bold" },
  msgList: { flex: 1, overflowY: "auto", padding: "20px" },
  mRow: { display: "flex", gap: "16px", marginBottom: "20px" },
  mAv: { width: "40px", height: "40px", borderRadius: "50%" },
  mMeta: { display: "flex", gap: "10px", alignItems: "center" },
  mText: { color: "#dbdee1", marginTop: "2px" },
  postedImg: { maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "10px" },
  inWrap: { padding: "0 20px 24px 20px" },
  inputContainer: { display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" },
  plusBtn: { background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold", fontSize: "18px" },
  chatIn: { flex: 1, padding: "12px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" },
  loginPage: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "30px", borderRadius: "8px", width: "350px", display: "flex", flexDirection: "column", gap: "15px" },
  input: { padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "12px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }
};
