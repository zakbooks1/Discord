"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ name: "", pass: "" });
  const [text, setText] = useState("");
  const [showAcc, setShowAcc] = useState(false);
  
  const pfpRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("discord_v31");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    if (!user) return;
    const [sRes, mRes] = await Promise.all([
      fetch(`/api/messages?type=servers&uid=${user.uid}`),
      fetch(`/api/messages?server=${activeServer}&uid=${user.uid}`)
    ]);
    const sData = await sRes.json();
    const mData = await mRes.json();
    setServers(Array.isArray(sData) ? sData : ["general"]);
    setMessages(Array.isArray(mData) ? mData.reverse() : []);
  };

  useEffect(() => { sync(); const i = setInterval(sync, 3500); return () => clearInterval(i); }, [user, activeServer]);

  const handleAuth = async () => {
    const res = await fetch("/api/messages", { 
      method: "POST", 
      body: JSON.stringify({ action: "auth", user: login.name, password: login.pass }) 
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("discord_v31", JSON.stringify(data.user));
    } else { alert(data.error); }
  };

  const send = async () => {
    if (!text.trim()) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    if (text.startsWith("/ban ")) {
      body.adminAction = true; body.action = "ban"; body.targetUid = text.split(" ")[1];
    } else if (text === "/clear") {
      body.adminAction = true; body.action = "clear";
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white'}}>
      <h1 style={{marginBottom:'20px'}}>Login</h1>
      <input placeholder="Username" onChange={e => setLogin({...login, name: e.target.value})} style={{padding:'12px', margin:'5px', width:'260px', borderRadius:'5px', border:'none', background:'#383a40', color:'white'}} />
      <input type="password" placeholder="Password" onChange={e => setLogin({...login, pass: e.target.value})} style={{padding:'12px', margin:'5px', width:'260px', borderRadius:'5px', border:'none', background:'#383a40', color:'white'}} />
      <button onClick={handleAuth} style={{padding:'12px', width:'260px', marginTop:'15px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold', cursor:'pointer'}}>Sign In / Register</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Server Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: s === "staff-room" ? "#ed4245" : (activeServer === s ? "#5865f2" : "#313338"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'9px', fontWeight:'bold' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor:'pointer', fontSize:'22px' }}>⚙️</div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428", fontWeight:'bold' }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background:'#1e1f22' }} />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>
                  {m.user} {m.isAdmin && "👑"} 
                  {m.displayUid && <span style={{marginLeft:'10px', fontSize:'9px', color:'#949ba4', fontWeight:'normal'}}>ID: {m.displayUid}</span>}
                </div>
                <div style={{color:'#dbdee1'}}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ width: "100%", padding: "12px", background: "#383a40", border: "none", color: "white", borderRadius: "8px" }} placeholder={`Message #${activeServer}...`} />
        </div>
      </div>

      {/* Settings Modal */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "320px", textAlign:'center' }}>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%', marginBottom:'10px'}} />
            <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR UNIQUE ID:</div>
            <code style={{color:'#f1c40f', background:'#1e1f22', padding:'5px', borderRadius:'4px', display:'block', margin:'10px 0'}}>{user.uid}</code>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{color:'#ed4245', background:'none', border:'none', cursor:'pointer', marginBottom:'20px'}}>Logout</button>
            <br/>
            <button onClick={() => setShowAcc(false)} style={{background:'#5865f2', color:'white', border:'none', padding:'8px 20px', borderRadius:'4px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
