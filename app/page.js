"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [showAcc, setShowAcc] = useState(false);
  const chatFileRef = useRef(null);

  // Load User & Sync
  useEffect(() => {
    const saved = localStorage.getItem("discord_v21");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    const [sRes, mRes] = await Promise.all([
      fetch("/api/messages?type=servers"),
      fetch(`/api/messages?server=${activeServer}`)
    ]);
    const sData = await sRes.json();
    const mData = await mRes.json();
    if (Array.isArray(sData)) setServers(sData);
    if (Array.isArray(mData)) setMessages(mData.reverse());
  };

  useEffect(() => { if (user) { sync(); const i = setInterval(sync, 3500); return () => clearInterval(i); } }, [user, activeServer]);

  // THE NEW COMMAND HANDLER
  const send = async (img = null) => {
    const val = text.trim();
    if (!val && !img) return;

    let body = { text: val, user: user.name, uid: user.uid, pfp: user.pfp, image: img, server: activeServer };

    // Parse Commands
    if (val.startsWith("/")) {
      const args = val.split(" ");
      const cmd = args[0].toLowerCase();

      // /nick [newname] - Local command
      if (cmd === "/nick" && args[1]) {
        const newUser = { ...user, name: args[1] };
        setUser(newUser);
        localStorage.setItem("discord_v21", JSON.stringify(newUser));
        setText("");
        return alert("Nickname changed!");
      }

      // Admin Commands
      if (cmd === "/ban" && args[1]) {
        body.adminAction = true; body.action = "ban"; body.targetUid = args[1];
        body.text = `🚫 User ${args[1]} has been banned.`;
      } 
      else if (cmd === "/unban" && args[1]) {
        body.adminAction = true; body.action = "unban"; body.targetUid = args[1];
        body.text = `✅ User ${args[1]} has been unbanned.`;
      } 
      else if (cmd === "/clear") {
        body.adminAction = true; body.action = "clear";
      }
    }

    const res = await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    if (res.status === 403) alert("YOU ARE BANNED.");
    setText(""); sync();
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
      <button onClick={() => {
        const n = prompt("Name?");
        const d = { name:n, uid: "u_"+Math.random().toString(36).slice(2), pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${n}` };
        setUser(d); localStorage.setItem("discord_v21", JSON.stringify(d));
      }} style={{padding:'15px', background:'#5865f2', color:'white', borderRadius:'5px', border:'none'}}>Join</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: activeServer === s ? "#5865f2" : "#313338", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'10px' }}>{s.toUpperCase().slice(0,3)}</div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428" }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user} {m.isAdmin && "🥭"} <span style={{fontSize:'8px', color:'#949ba4'}}>{m.uid}</span></div>
                <div>{m.text}</div>
                {m.image && <img src={m.image} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }} />}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ width: "100%", padding: "12px", background: "#383a40", border: "none", color: "white", borderRadius: "8px" }} placeholder="Type a command or message..." />
        </div>
      </div>
      
      {/* Settings (Shows your ID) */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", textAlign:'center' }}>
            <div style={{fontSize:'10px'}}>YOUR ID:</div>
            <code style={{color:'#f1c40f'}}>{user.uid}</code>
            <br/><br/>
            <button onClick={() => setShowAcc(false)} style={{padding:'10px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
