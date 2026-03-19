"use client";
import { useEffect, useState } from "react";
import Login from "../components/Login";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [showAcc, setShowAcc] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("v_final_fixed");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    if (!user || user.uid === "u_undefined") return;
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
      const cmds = ["/clear", "/announce", "/ban", "/shrug"];
      const match = cmds.find(c => c.startsWith(val.split(" ")[0]));
      setSuggestion(match && match !== val ? `Did you mean ${match}?` : "");
    } else { setSuggestion(""); }
  };

  const send = async () => {
    if (!text.trim()) return;
    setSuggestion("");
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    if (text === "/clear") { body.adminAction = true; body.action = "clear"; }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return <Login onAuth={setUser} />;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: s === "staff-room" ? "#ed4245" : (activeServer === s ? "#5865f2" : "#313338"), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'9px', fontWeight:'bold' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor:'pointer' }}>⚙️</div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428", fontWeight:'bold' }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background:'#1e1f22' }} />
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

      {/* Settings */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex:100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", textAlign:'center' }}>
            <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR ADMIN ID:</div>
            <code style={{color:'#f1c40f', display:'block', margin:'10px 0'}}>{user.uid}</code>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{color:'#ed4245', background:'none', border:'none', cursor:'pointer'}}>Logout</button>
            <br/><br/>
            <button onClick={() => setShowAcc(false)} style={{background:'#5865f2', color:'white', border:'none', padding:'8px 20px', borderRadius:'4px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
