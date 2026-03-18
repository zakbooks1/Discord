"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [showAcc, setShowAcc] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [regName, setRegName] = useState("");
  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("discord_account_v16");
    if (saved) {
      setUser(JSON.parse(saved));
      setIsLoggedIn(true);
    }
  }, []);

  const createAccount = () => {
    if (!regName) return alert("Enter a name");
    // Generate a Real Unique ID
    const newUid = "u_" + Math.random().toString(36).substr(2, 9);
    const data = {
      name: regName,
      uid: newUid,
      pfp: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${regName}`,
      joined: new Date().toLocaleDateString()
    };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("discord_account_v16", JSON.stringify(data));
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

  const send = async (img = null) => {
    let msgText = text.trim();
    if (!msgText && !img) return;

    const isAdminCmd = msgText.startsWith("/");
    const body = {
      text: msgText,
      user: user.name,
      uid: user.uid, // Sent to server to verify Admin status
      pfp: user.pfp,
      image: img,
      server: activeServer
    };

    if (isAdminCmd) {
      const [cmd, target] = msgText.split(" ");
      if (cmd === "/ban" || cmd === "/unban") {
        body.adminAction = true;
        body.action = cmd.slice(1);
        body.target = target;
      }
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.status === 401) alert("You aren't on the Admin Whitelist!");
    setText(""); loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={s.loginBg}>
        <div style={s.loginCard}>
          <h2 style={{color:'white', margin:0}}>Welcome Back</h2>
          <p style={{color:'#b5bac1', fontSize:'14px'}}>Enter a name to start chatting.</p>
          <input placeholder="Username" onChange={e => setRegName(e.target.value)} style={s.input} />
          <button onClick={createAccount} style={s.btn}>Create Account</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.app}>
      {/* Sidebar */}
      <div style={s.side}>
        <div style={s.icon}>D</div>
        <div onClick={() => setShowAcc(true)} style={{marginTop:'auto', cursor:'pointer', fontSize:'24px'}}>⚙️</div>
      </div>

      {/* Chat Area */}
      <div style={s.main}>
        <div style={s.header}># {activeServer}</div>
        <div style={s.msgList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={s.msgRow}>
              <img src={m.pfp} style={s.av} />
              <div>
                <div style={{fontWeight:'bold', color: m.isAdmin ? '#f1c40f' : 'white'}}>
                  {m.user} {m.isAdmin && <span style={s.badge}>STAFF</span>}
                </div>
                <div style={{color:'#dbdee1'}}>{m.text}</div>
                {m.image && <img src={m.image} style={s.postedImg} />}
              </div>
            </div>
          ))}
        </div>

        <div style={s.inputArea}>
          <div style={s.inputWrap}>
            <button onClick={() => chatFileRef.current.click()} style={s.plus}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   placeholder={`Message #${activeServer}`} style={s.chatInput} />
            <input type="file" ref={chatFileRef} style={{display:'none'}} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
          </div>
        </div>
      </div>

      {/* ACCOUNT CENTER */}
      {showAcc && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <h3 style={{margin:0}}>Account Center</h3>
            <div style={s.uidBox}>
              <span style={{fontSize:'12px', color:'#b5bac1'}}>YOUR UNIQUE ID (Private)</span>
              <code style={{color:'#f1c40f', background:'#1e1f22', padding:'5px', borderRadius:'4px'}}>{user.uid}</code>
            </div>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{...s.btn, background:'#ed4245'}}>Delete Account</button>
            <button onClick={() => setShowAcc(false)} style={{...s.btn, background:'#4e5058'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  app: { display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" },
  side: { width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" },
  icon: { width: "48px", height: "48px", background: "#5865f2", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" },
  main: { flex: 1, display: "flex", flexDirection: "column" },
  header: { height: "48px", borderBottom: "1px solid #232428", display: "flex", alignItems: "center", padding: "0 16px", fontWeight: "bold" },
  msgList: { flex: 1, overflowY: "auto", padding: "20px" },
  msgRow: { display: "flex", gap: "15px", marginBottom: "20px" },
  av: { width: "40px", height: "40px", borderRadius: "50%" },
  badge: { fontSize: "10px", background: "#f1c40f", color: "black", padding: "2px 5px", borderRadius: "3px", marginLeft: "5px" },
  postedImg: { maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "10px" },
  inputArea: { padding: "20px" },
  inputWrap: { background: "#383a40", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 15px" },
  plus: { background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" },
  chatInput: { flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" },
  loginBg: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e1f22" },
  loginCard: { background: "#313338", padding: "40px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", gap: "20px" },
  input: { padding: "12px", borderRadius: "4px", border: "none", background: "#1e1f22", color: "white" },
  btn: { padding: "12px", background: "#5865f2", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" },
  modal: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modalCard: { background: "#313338", padding: "30px", borderRadius: "8px", width: "300px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" },
  uidBox: { textAlign: "center", display: "flex", flexDirection: "column", gap: "5px", width: "100%" }
};
