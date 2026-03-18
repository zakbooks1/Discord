"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cmdHint, setCmdHint] = useState("");

  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  
  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);
  const scrollRef = useRef(null);
  
  const ADMIN_KEY = "67man76";
  const FUNNY_CMDS = ["/clear", "/yeet", "/spam", "/ghost", "/clown"];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v8");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  // Admin Auto-Correct Helper
  useEffect(() => {
    if (user.isAdmin && text.startsWith("/")) {
      const match = FUNNY_CMDS.find(c => c.startsWith(text.toLowerCase()));
      setCmdHint(match && match !== text ? `Did you mean ${match}?` : "");
    } else { setCmdHint(""); }
  }, [text, user.isAdmin]);

  const handleLogin = () => {
    if (!tempName) return alert("Enter name");
    const isAdm = tempPass.trim() === ADMIN_KEY;
    const data = { 
      name: tempName, isAdmin: isAdm, pass: tempPass, 
      pfp: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${tempName}` 
    };
    setUser(data); setIsLoggedIn(true);
    localStorage.setItem("chat-v8", JSON.stringify(data));
  };

  const updatePFP = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const newUser = { ...user, pfp: reader.result };
      setUser(newUser);
      localStorage.setItem("chat-v8", JSON.stringify(newUser));
      alert("PFP Updated!");
    };
    reader.readAsDataURL(file);
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

  const send = async (img = null, overrideText = null) => {
    const msgText = overrideText || text;
    if (!msgText.trim() && !img) return;

    // Handle Admin Commands
    if (msgText.startsWith("/") && user.isAdmin) {
      const cmd = msgText.toLowerCase();
      if (cmd === "/clear") {
        await fetch("/api/messages", { method: "DELETE", headers: { "admin-pass": user.pass }, body: JSON.stringify({ server: activeServer, clearAll: true }) });
      } else if (cmd === "/yeet") {
        await send(null, "🚀 TARGET ACQUIRED. YEETING USER INTO LOW ORBIT.");
      } else if (cmd === "/clown") {
        await send(null, "🤡 HONK HONK! AN ADMIN HAS DECLARED THIS CHANNEL A CIRCUS.");
      } else if (cmd === "/ghost") {
        await send(null, "👻 BOO! (This admin is now invisible... mostly)");
      }
      setText(""); loadData(); return;
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msgText, user: user.name, isAdmin: user.isAdmin, pfp: user.pfp, image: img, server: activeServer }),
    });
    setText(""); loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginBg}>
        <div style={styles.loginCard}>
          <h1 style={{color:'white', textAlign:'center'}}>Discord Pro</h1>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={styles.in} />
          <input placeholder="Admin Pass" type="password" onChange={e => setTempPass(e.target.value)} style={styles.in} />
          <button onClick={handleLogin} style={styles.btn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* Account Center Modal */}
      {showSettings && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Account Center</h2>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <input type="file" ref={pfpFileRef} style={{display:'none'}} onChange={updatePFP} />
            <button onClick={() => pfpFileRef.current.click()} style={styles.btn}>Change PFP from Library</button>
            <button onClick={() => setShowSettings(false)} style={{...styles.btn, background:'#4e5058'}}>Close</button>
          </div>
        </div>
      )}

      <div style={styles.side1}>
        <div style={styles.sCirc}>D</div>
        <div onClick={() => setShowSettings(true)} style={styles.settingsIcon}>⚙️</div>
        <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.logout}>Log Out</button>
      </div>

      <div style={styles.main}>
        <div style={styles.mHead}># {activeServer} {user.isAdmin && <span style={styles.badge}>ADMIN</span>}</div>
        
        <div style={styles.msgList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.mRow}>
              <img src={m.pfp} style={styles.mAv} />
              <div style={{flex:1}}>
                <div style={styles.mMeta}><span style={{fontWeight:'bold', color: m.isAdmin ? '#f1c40f' : 'white'}}>{m.user}</span></div>
                {m.text && <div style={styles.mText}>{m.text}</div>}
                {m.image && <img src={m.image} style={styles.postedImg} />}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.inWrap}>
          {cmdHint && <div style={styles.hint}>{cmdHint}</div>}
          <div style={styles.inputContainer}>
            <input type="file" accept="image/*" ref={chatFileRef} style={{display:'none'}} onChange={(e)=>{
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => chatFileRef.current.click()} style={styles.plusBtn}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={styles.chatIn} placeholder="Type /yeet or /clear..." />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" },
  side1: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "15px" },
  sCirc: { width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  settingsIcon: { fontSize: "24px", cursor: "pointer" },
  logout: { marginTop: "auto", background: "#ed4245", border: "none", color: "white", padding: "5px", borderRadius: "4px", fontSize: "10px" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  mHead: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #26272d", fontWeight: "bold", gap: "10px" },
  badge: { fontSize: "10px", background: "#f1c40f", color: "black", padding: "2px 5px", borderRadius: "3px" },
  msgList: { flex: 1, overflowY: "auto", padding: "20px" },
  mRow: { display: "flex", gap: "16px", marginBottom: "20px" },
  mAv: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" },
  mMeta: { display: "flex", gap: "10px", marginBottom: "2px" },
  postedImg: { maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "10px" },
  inWrap: { padding: "0 20px 24px 20px" },
  hint: { fontSize: "12px", color: "#f1c40f", marginBottom: "5px", marginLeft: "45px" },
  inputContainer: { display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" },
  plusBtn: { background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" },
  chatIn: { flex: 1, padding: "12px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "#313338", padding: "40px", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" },
  loginBg: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#1e1f22" },
  loginCard: { backgroundColor: "#313338", padding: "40px", borderRadius: "8px", width: "350px", display: "flex", flexDirection: "column", gap: "15px" },
  in: { padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  btn: { padding: "12px", backgroundColor: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }
};
