"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [creds, setCreds] = useState({ name: "", pass: "" });
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [showAcc, setShowAcc] = useState(false);

  const CMDS = ["/ban", "/unban", "/clear", "/announce", "/nick", "/shrug", "/dice"];

  useEffect(() => {
    const saved = localStorage.getItem("v_final_fixed");
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

  const handleInput = (val) => {
    setText(val);
    if (val.startsWith("/")) {
      const match = CMDS.find(c => c.startsWith(val.split(" ")[0]));
      setSuggestion(match && match !== val ? `Did you mean ${match}?` : "");
    } else { setSuggestion(""); }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSuggestion("");
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    if (text.startsWith("/")) {
      const args = text.split(" ");
      const cmd = args[0].toLowerCase();
      
      if (cmd === "/clear") { body.adminAction = true; body.action = "clear"; }
      if (cmd === "/announce") { body.adminAction = true; body.action = "announce"; body.text = args.slice(1).join(" "); }
      if (cmd === "/ban") { body.adminAction = true; body.action = "ban"; body.targetUid = args[1]; }
      if (cmd === "/shrug") body.text = "¯\\_(ツ)_/¯";
      if (cmd === "/dice") body.text = `🎲 Rolled: ${Math.floor(Math.random()*6)+1}`;
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white'}}>
      <h2 style={{marginBottom:'20px'}}>Discord Login</h2>
      <input placeholder="Username" onChange={e => setCreds({...creds, name: e.target.value})} style={{padding:'12px', margin:'5px', width:'250px', background:'#383a40', color:'white', border:'none', borderRadius:'5px'}} />
      <input type="password" placeholder="Password" onChange={e => setCreds({...creds, pass: e.target.value})} style={{padding:'12px', margin:'5px', width:'250px', background:'#383a40', color:'white', border:'none', borderRadius:'5px'}} />
      <button onClick={handleAuth} style={{padding:'12px', width:'250px', marginTop:'10px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Login</button>
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
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428", fontWeight:'bold' }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px", borderLeft: m.isAnnounce ? '4px solid #5865f2' : 'none', paddingLeft: m.isAnnounce ? '10px' : '0' }}>
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
        <div style={{ padding: "20px", position: 'relative' }}>
          {suggestion && <div style={{ position: 'absolute', top: '-10px', left: '25px', background: '#5865f2', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>{suggestion}</div>}
          <input value={text} onChange={e => handleInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ width: "100%", padding: "12px", background: "#383a40", border: "none", color: "white", borderRadius: "8px" }} placeholder={`Message #${activeServer}...`} />
        </div>
      </div>
    </div>
  );
}
