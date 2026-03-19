"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [authData, setAuthData] = useState({ name: "", pass: "" });
  const [text, setText] = useState("");
  const [showAcc, setShowAcc] = useState(false);
  
  const pfpRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("discord_v30");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    if (!user) return;
    const [sRes, mRes] = await Promise.all([
      fetch(`/api/messages?type=servers`),
      fetch(`/api/messages?server=${activeServer}`)
    ]);
    const sData = await sRes.json();
    const mData = await mRes.json();
    if (Array.isArray(sData)) setServers(sData);
    if (Array.isArray(mData)) setMessages(mData.reverse());
  };

  useEffect(() => { sync(); const i = setInterval(sync, 3000); return () => clearInterval(i); }, [user, activeServer]);

  const handleAuth = async () => {
    if (!authData.name || !authData.pass) return alert("Fill everything!");
    const res = await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ action: "auth", user: authData.name, password: authData.pass })
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("discord_v30", JSON.stringify(data.user));
    } else { alert(data.error); }
  };

  const uploadPfp = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const newPfp = reader.result;
      const updatedUser = { ...user, pfp: newPfp };
      setUser(updatedUser);
      localStorage.setItem("discord_v30", JSON.stringify(updatedUser));
      await fetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ action: "update_pfp", uid: user.uid, pfp: newPfp })
      });
    };
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!text.trim()) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    if (text.startsWith("/announce")) {
        body.adminAction = true; body.action = "announce"; body.text = text.replace("/announce ", "");
    } else if (text === "/clear") {
        body.adminAction = true; body.action = "clear";
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white', gap:'10px'}}>
      <h2 style={{marginBottom:'20px'}}>Welcome Back</h2>
      <input placeholder="Username" onChange={e => setAuthData({...authData, name: e.target.value})} style={{padding:'10px', borderRadius:'5px', border:'none', width:'250px', background:'#383a40', color:'white'}} />
      <input type="password" placeholder="Password" onChange={e => setAuthData({...authData, pass: e.target.value})} style={{padding:'10px', borderRadius:'5px', border:'none', width:'250px', background:'#383a40', color:'white'}} />
      <button onClick={handleAuth} style={{padding:'10px 20px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', width:'250px', fontWeight:'bold', marginTop:'10px'}}>Login / Register</button>
      <p style={{fontSize:'11px', color:'#949ba4'}}>New users will be registered automatically.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: activeServer === s ? "#5865f2" : "#313338", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'10px' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize:'20px' }}>⚙️</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428", fontWeight:'bold' }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px", background: m.isAnnounce ? 'rgba(88,101,242,0.1)' : 'transparent', padding: m.isAnnounce ? '10px' : '0', borderLeft: m.isAnnounce ? '4px solid #5865f2' : 'none' }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user} {m.isAdmin && "👑"}</div>
                <div style={{color:'#dbdee1'}}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ width: "100%", padding: "12px", background: "#383a40", border: "none", color: "white", borderRadius: "8px" }} placeholder={`Message #${activeServer}...`} />
        </div>
      </div>

      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "320px", textAlign:'center' }}>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <input type="file" ref={pfpRef} style={{display:'none'}} onChange={uploadPfp} />
            <button onClick={() => pfpRef.current.click()} style={{width:'100%', padding:'10px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px', margin:'15px 0', cursor:'pointer'}}>Upload New PFP</button>
            <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR ADMIN ID:</div>
            <code style={{color:'#f1c40f', background:'#1e1f22', padding:'5px', borderRadius:'4px', display:'block', margin:'5px 0'}}>{user.uid}</code>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{color:'#ed4245', background:'none', border:'none', cursor:'pointer', marginTop:'10px'}}>Logout</button>
            <br/><br/>
            <button onClick={() => setShowAcc(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
