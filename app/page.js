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
  const CMDS = ["/ban", "/unban", "/clear", "/announce", "/nick", "/shrug", "/dice", "/help"];

  useEffect(() => {
    const saved = localStorage.getItem("discord_v25");
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
    if (Array.isArray(sData)) setServers(sData);
    if (Array.isArray(mData)) setMessages(mData.reverse());
  };

  useEffect(() => { sync(); const i = setInterval(sync, 3000); return () => clearInterval(i); }, [user, activeServer]);

  const onTyping = (val) => {
    setText(val);
    if (val.startsWith("/")) {
      const match = CMDS.find(c => c.startsWith(val.split(" ")[0]));
      setSuggestion(match && match !== val ? `Did you mean ${match}?` : "");
    } else { setSuggestion(""); }
  };

  const send = async (img = null) => {
    if (!text.trim() && !img) return;
    setSuggestion("");
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, image: img, server: activeServer };

    if (text.startsWith("/")) {
      const args = text.split(" ");
      const cmd = args[0].toLowerCase();
      if (cmd === "/shrug") body.text = "¯\\_(ツ)_/¯";
      if (cmd === "/dice") body.text = `🎲 Rolled: ${Math.floor(Math.random()*6)+1}`;
      if (cmd === "/nick" && args[1]) {
        const up = { ...user, name: args[1] };
        setUser(up); localStorage.setItem("discord_v25", JSON.stringify(up));
        setText(""); return;
      }
      if (["/ban", "/unban", "/clear", "/announce"].includes(cmd)) {
        body.adminAction = true;
        body.action = cmd.slice(1);
        body.targetUid = args[1];
        if (cmd === "/announce") body.text = args.slice(1).join(" ");
      }
    }

    const res = await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    if (res.status === 403) alert("BANNED.");
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
      <button onClick={() => {
        const n = prompt("Username?");
        const d = { name: n||"Guest", uid: "u_"+Math.random().toString(36).slice(2,10), pfp: "https://api.dicebear.com/7.x/bottts/svg?seed="+(n||"Guest") };
        setUser(d); localStorage.setItem("discord_v25", JSON.stringify(d));
      }} style={{padding:'15px 30px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Initialize Login</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Side Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: s === "staff-room" ? "#ed4245" : (activeServer === s ? "#5865f2" : "#313338"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'9px', fontWeight:'bold' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428", fontWeight:'bold' }}># {activeServer}</div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px", padding: m.isAnnounce ? '12px' : '0', background: m.isAnnounce ? 'rgba(88,101,242,0.1)' : 'transparent', borderLeft: m.isAnnounce ? '4px solid #5865f2' : 'none', borderRadius:'4px' }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background:'#1e1f22' }} />
              <div style={{flex:1}}>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : (m.isAnnounce ? "#5865f2" : "white") }}>{m.user} {m.isAdmin && "👑"} <span style={{fontSize:'8px', color:'#949ba4'}}>{m.uid}</span></div>
                <div style={{color:'#dbdee1', fontSize: m.isAnnounce ? '16px' : '14px'}}>{m.text}</div>
                {m.image && <img src={m.image} style={{maxWidth:'100%', borderRadius:'8px', marginTop:'8px'}} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px", position:'relative' }}>
          {suggestion && <div style={{position:'absolute', top:'-8px', left:'30px', background:'#5865f2', padding:'2px 8px', borderRadius:'4px', fontSize:'11px'}}>{suggestion}</div>}
          <div style={{background:'#383a40', borderRadius:'8px', display:'flex', alignItems:'center', padding:'0 10px'}}>
            <button onClick={() => chatFileRef.current.click()} style={{background:'#b5bac1', border:'none', borderRadius:'50%', width:'24px', height:'24px', cursor:'pointer'}}>+</button>
            <input value={text} onChange={e => onTyping(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ flex:1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder={`Message #${activeServer}...`} />
            <input type="file" ref={chatFileRef} style={{display:'none'}} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
          </div>
        </div>
      </div>

      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <input type="file" ref={pfpRef} style={{display:'none'}} onChange={e => {
              const r = new FileReader(); r.onloadend = () => {
                const up = {...user, pfp: r.result}; setUser(up); localStorage.setItem("discord_v25", JSON.stringify(up));
              }; r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => pfpRef.current.click()} style={{width:'100%', padding:'10px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px'}}>Change PFP</button>
            <div style={{textAlign:'center', width:'100%'}}>
              <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR ADMIN ID:</div>
              <code style={{color:'#f1c40f', background:'#1e1f22', padding:'5px', display:'block', borderRadius:'4px', marginTop:'5px'}}>{user.uid}</code>
            </div>
            <button onClick={() => setShowAcc(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
