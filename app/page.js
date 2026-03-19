"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [showAcc, setShowAcc] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  
  const pfpRef = useRef(null);
  const chatFileRef = useRef(null);
  const CMDS = ["/ban", "/unban", "/clear", "/announce", "/nick", "/shrug", "/dice"];

  useEffect(() => {
    const saved = localStorage.getItem("discord_v26");
    if (saved) {
      const parsed = JSON.parse(saved);
      // HARD FIX: If ID is undefined, force a new one
      if (!parsed.uid || parsed.uid === "u_undefined") {
        parsed.uid = "u_" + Math.random().toString(36).slice(2, 11);
        localStorage.setItem("discord_v26", JSON.stringify(parsed));
      }
      setUser(parsed);
    }
  }, []);

  const sync = async () => {
    if (!user) return;
    try {
      const [sRes, mRes] = await Promise.all([
        fetch(`/api/messages?type=servers&uid=${user.uid}`),
        fetch(`/api/messages?server=${activeServer}&uid=${user.uid}`)
      ]);
      const sData = await sRes.json();
      const mData = await mRes.json();
      if (Array.isArray(sData)) setServers(sData);
      if (Array.isArray(mData)) setMessages(mData.reverse());
    } catch (e) { console.error("Sync failed"); }
  };

  useEffect(() => { sync(); const i = setInterval(sync, 3000); return () => clearInterval(i); }, [user, activeServer]);

  const send = async (img = null) => {
    if (!text.trim() && !img) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, image: img, server: activeServer };

    if (text.startsWith("/")) {
      const args = text.split(" ");
      const cmd = args[0].toLowerCase();
      if (["/ban", "/unban", "/clear", "/announce"].includes(cmd)) {
        body.adminAction = true;
        body.action = cmd.slice(1);
        body.targetUid = args[1];
        if (cmd === "/announce") body.text = args.slice(1).join(" ");
      }
      if (cmd === "/shrug") body.text = "¯\\_(ツ)_/¯";
      if (cmd === "/nick" && args[1]) {
        const up = { ...user, name: args[1] };
        setUser(up); localStorage.setItem("discord_v26", JSON.stringify(up));
        setText(""); return;
      }
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
      <button onClick={() => {
        const n = prompt("Username?");
        const d = { name: n||"User", uid: "u_"+Math.random().toString(36).slice(2,11), pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${n}` };
        setUser(d); localStorage.setItem("discord_v26", JSON.stringify(d));
      }} style={{padding:'15px 30px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px'}}>Login</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: s === "staff-room" ? "#ed4245" : (activeServer === s ? "#5865f2" : "#313338"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'9px' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer" }}>⚙️</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428" }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px", padding: m.isAnnounce ? '12px' : '0', background: m.isAnnounce ? 'rgba(88,101,242,0.1)' : 'transparent', borderLeft: m.isAnnounce ? '4px solid #5865f2' : 'none' }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background:'#2b2d31' }} 
                   onError={(e) => e.target.src = "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"}/>
              <div style={{flex:1}}>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user} {m.isAdmin && "👑"}</div>
                <div>{m.text}</div>
                {m.image && <img src={m.image} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'8px'}} />}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ width: "100%", padding: "12px", background: "#383a40", border: "none", color: "white", borderRadius: "8px" }} placeholder={`Message #${activeServer}...`} />
        </div>
      </div>

      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "300px", textAlign:'center' }}>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%', marginBottom:'10px'}} />
            <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR ID (Copy this to backend):</div>
            <code style={{color:'#f1c40f', display:'block', margin:'10px 0'}}>{user.uid}</code>
            <button onClick={() => setShowAcc(false)} style={{background:'#5865f2', color:'white', border:'none', padding:'8px 20px', borderRadius:'4px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
