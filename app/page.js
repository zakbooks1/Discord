"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [creds, setCreds] = useState({ name: "", pass: "" });
  const [text, setText] = useState("");
  const [showAcc, setShowAcc] = useState(false);

  useEffect(() => {
    // We use a new key 'v_final' to force a fresh login
    const saved = localStorage.getItem("v_final");
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

  useEffect(() => { sync(); const i = setInterval(sync, 3000); return () => clearInterval(i); }, [user, activeServer]);

  const handleAuth = async () => {
    const res = await fetch("/api/messages", { method: "POST", body: JSON.stringify({ action: "auth", user: creds.name, password: creds.pass }) });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("v_final", JSON.stringify(data.user));
    } else { alert(data.error); }
  };

  const send = async () => {
    if (!text.trim()) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    if (text === "/clear") { body.adminAction = true; body.action = "clear"; }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white'}}>
      <h2 style={{marginBottom:'20px'}}>Secure Login</h2>
      <input placeholder="Username" onChange={e => setCreds({...creds, name: e.target.value})} style={{padding:'12px', margin:'5px', width:'250px', background:'#383a40', color:'white', border:'none', borderRadius:'5px'}} />
      <input type="password" placeholder="Password" onChange={e => setCreds({...creds, pass: e.target.value})} style={{padding:'12px', margin:'5px', width:'250px', background:'#383a40', color:'white', border:'none', borderRadius:'5px'}} />
      <button onClick={handleAuth} style={{padding:'12px', width:'250px', marginTop:'10px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Login / Register</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: s === "staff-room" ? "#ed4245" : (activeServer === s ? "#5865f2" : "#313338"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'9px', fontWeight:'bold' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor:'pointer', fontSize:'20px' }}>⚙️</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428" }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>
                  {m.user} {m.isAdmin && "👑"} 
                  {m.displayUid && <span style={{fontSize:'8px', color:'#949ba4', marginLeft:'10px'}}>ID: {m.displayUid}</span>}
                </div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ width: "100%", padding: "12px", background: "#383a40", border: "none", color: "white", borderRadius: "8px" }} placeholder={`Message #${activeServer}...`} />
        </div>
      </div>

      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex:100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", textAlign:'center' }}>
            <div style={{fontSize:'10px', color:'#949ba4'}}>COPY THIS ID TO BACKEND:</div>
            <code style={{color:'#f1c40f', display:'block', margin:'10px 0'}}>{user.uid}</code>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{color:'#ed4245', background:'none', border:'none', cursor:'pointer'}}>Logout & Reset</button>
            <br/><br/>
            <button onClick={() => setShowAcc(false)} style={{background:'#5865f2', color:'white', border:'none', padding:'8px 20px', borderRadius:'4px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
