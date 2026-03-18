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
  const channels = [{ id: "general", icon: "#" }, { id: "media", icon: "📸" }, { id: "gaming", icon: "🎮" }];
  const FUNNY_CMDS = ["/clear", "/yeet", "/clown", "/ghost", "/spam"];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v10-final");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  // Admin Command Hint Logic
  useEffect(() => {
    if (user.isAdmin && text.startsWith("/")) {
      const match = FUNNY_CMDS.find(c => c.startsWith(text.toLowerCase()));
      setCmdHint(match && match !== text ? `Did you mean ${match}?` : "");
    } else { setCmdHint(""); }
  }, [text, user.isAdmin]);

  const handleLogin = () => {
    if (!tempName) return alert("Enter a name");
    const isAdm = tempPass.trim() === ADMIN_KEY;
    const data = { 
      name: tempName, isAdmin: isAdm, pass: tempPass, 
      pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${tempName}` 
    };
    setUser(data); setIsLoggedIn(true);
    localStorage.setItem("chat-v10-final", JSON.stringify(data));
  };

  const updatePFP = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newUser = { ...user, pfp: reader.result };
      setUser(newUser);
      localStorage.setItem("chat-v10-final", JSON.stringify(newUser));
      alert("Profile Picture Updated!");
    };
    reader.readAsDataURL(file);
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.error("Load failed"); }
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

  const send = async (img = null) => {
    let msgText = text;

    if (user.isAdmin && msgText.startsWith("/")) {
      const cmd = msgText.toLowerCase().trim();
      if (cmd === "/clear") {
        await fetch("/api/messages", { 
          method: "DELETE", 
          headers: { "admin-pass": user.pass }, 
          body: JSON.stringify({ server: activeServer, clearAll: true }) 
        });
        setText(""); loadData(); return;
      }
      if (cmd === "/yeet") msgText = "🚀 TARGET ELIMINATED. YEET!";
      if (cmd === "/clown") msgText = "🤡 HONK! THE CIRCUS HAS ARRIVED.";
    }

    if (!msgText.trim() && !img) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: msgText, user: user.name, isAdmin: user.isAdmin, 
        pfp: user.pfp, image: img, server: activeServer 
      }),
    });
    setText(""); loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginCard}>
          <h2 style={{color:'white', textAlign:'center'}}>Discord Pro</h2>
          <input placeholder="Username" autoCapitalize="none" onChange={e => setTempName(e.target.value)} style={styles.input} />
          <input placeholder="Admin Password" type="password" autoCapitalize="none" onChange={e => setTempPass(e.target.value)} style={styles.input} />
          <button onClick={handleLogin} style={styles.loginBtn}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appFrame}>
      {/* Account Center Modal */}
      {showSettings && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{margin:0}}>Account Center</h3>
            <img src={user.pfp} style={{width:100, height:100, borderRadius:'50%', border:'3px solid #5865f2'}} />
            <input type="file" accept="image/*" ref={pfpFileRef} style={{display:'none'}} onChange={updatePFP} />
            <button onClick={() => pfpFileRef.current.click()} style={styles.loginBtn}>Upload New PFP</button>
            <button onClick={() => setShowSettings(false)} style={{...styles.loginBtn, background:'#4e5058'}}>Back to Chat</button>
          </div>
        </div>
      )}

      {/* Sidebar 1: Icons */}
      <div style={styles.sidebar1}>
        <div style={styles.serverIconActive}>D</div>
        <div onClick={() => setShowSettings(true)} style={{fontSize:'24px', cursor:'pointer', marginTop:'10px'}}>⚙️</div>
        <div onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.logoutBtn}>EXIT</div>
      </div>

      {/* Sidebar 2: Channels */}
      <div style={styles.sidebar2}>
        <div style={styles.chanHeader}>TEXT CHANNELS</div>
        {channels.map(chan => (
          <div key={chan.id} onClick={() => setActiveServer(chan.id)} 
               style={{...styles.chanItem, backgroundColor: activeServer === chan.id ? "#3f4147" : "transparent", color: activeServer === chan.id ? "white" : "#8e9297"}}>
            {chan.icon} {chan.id}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={styles.topBar}>
          # {activeServer} {user.isAdmin && <span style={styles.adminBadge}>ADMIN</span>}
        </div>

        <div style={styles.messageArea} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.msgRow}>
              <img src={m.pfp} style={styles.msgAv} alt="" />
              <div style={{flex:1}}>
                <div style={{fontWeight:'bold', color: m.isAdmin ? '#f1c40f' : 'white', fontSize:'14px'}}>{m.user}</div>
                <div style={{color:'#dbdee1', marginTop:'2px'}}>{m.text}</div>
                {m.image && <img src={m.image} style={styles.chatImg} alt="" />}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div style={styles.inputWrapper}>
          {cmdHint && <div style={styles.hintText}>{cmdHint}</div>}
          <div style={styles.inputBox}>
            <input type="file" accept="image/*" ref={chatFileRef} style={{display:'none'}} onChange={(e) => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => chatFileRef.current.click()} style={styles.plusBtn}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={styles.textInput} placeholder={`Message #${activeServer}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appFrame: { display: "flex", height: "100vh", width: "100vw", backgroundColor: "#313338", overflow: "hidden" },
  sidebar1: { width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" },
  serverIconActive: { width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  logoutBtn: { marginTop: "auto", fontSize: "10px", color: "#ed4245", cursor: "pointer", fontWeight: "bold" },
  sidebar2: { width: "240px", backgroundColor: "#2b2d31", display: "flex", flexDirection: "column", padding: "10px" },
  chanHeader: { padding: "10px", fontSize: "12px", fontWeight: "bold", color: "#949ba4" },
  chanItem: { padding: "10px", borderRadius: "4px", cursor: "pointer", marginBottom: "2px", fontWeight: "500" },
  mainContent: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topBar: { height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold", color: "white" },
  adminBadge: { marginLeft: "10px", backgroundColor: "#f1c40f", color: "black", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  messageArea: { flex: 1, overflowY: "auto", padding: "20px" },
  msgRow: { display: "flex", gap: "15px", marginBottom: "20px" },
  msgAv: { width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#4e5058", objectFit: "cover" },
  chatImg: { maxWidth: "100%", maxHeight: "350px", borderRadius: "8px", marginTop: "10px", border: "1px solid #444" },
  inputWrapper: { padding: "0 20px 24px 20px" },
  inputBox: { display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" },
  plusBtn: { background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", fontWeight: "bold" },
  textInput: { flex: 1, padding: "12px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" },
  hintText: { color: "#f1c40f", fontSize: "12px", marginBottom: "5px", marginLeft: "45px" },
  modalOverlay: { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modal: { backgroundColor: "#313338", padding: "30px", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", color: "white", width: "300px" },
  loginPage: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e1f22" },
  loginCard: { background: "#313338", padding: "40px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", gap: "15px" },
  input: { padding: "12px", borderRadius: "4px", border: "none", backgroundColor: "#1e1f22", color: "white" },
  loginBtn: { padding: "12px", background: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }
};
