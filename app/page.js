"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [showAcc, setShowAcc] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("discord_v18");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const loadServers = async () => {
    const res = await fetch("/api/messages?type=servers");
    const data = await res.json();
    if (data.length > 0) setServers(data);
  };

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?server=${activeServer}`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data.reverse());
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadServers();
      loadMessages();
      const interval = setInterval(() => { loadMessages(); loadServers(); }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  const updatePfp = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...user, pfp: reader.result };
      setUser(updated);
      localStorage.setItem("discord_v18", JSON.stringify(updated));
      alert("PFP Updated!");
    };
    reader.readAsDataURL(file);
  };

  const createServer = async () => {
    const name = prompt("Enter new server name:");
    if (!name) return;
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ action: "create_server", serverName: name, uid: user.uid })
    });
    loadServers();
  };

  const send = async (img = null) => {
    if (!text.trim() && !img) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text, user: user.name, uid: user.uid, pfp: user.pfp, 
        image: img, server: activeServer 
      }),
    });
    setText(""); loadMessages();
  };

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
        <button onClick={() => {
          const name = prompt("Username?");
          const data = { name, uid: "u_"+Math.random().toString(36).hex, pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}` };
          setUser(data); setIsLoggedIn(true); localStorage.setItem("discord_v18", JSON.stringify(data));
        }} style={{padding:'15px 30px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold'}}>Create Account</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      
      {/* SERVER LIST */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "12px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} 
               style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: activeServer === s ? "#5865f2" : "#313338", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", fontWeight: "bold", overflow: "hidden" }}>
            {s.substring(0, 2).toUpperCase()}
          </div>
        ))}
        {/* ADD SERVER BUTTON (Admin Only check is in the function) */}
        <div onClick={createServer} style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#23a559", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "24px" }}>+</div>
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold" }}># {activeServer}</div>
        
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1e1f22" }} />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user} {m.isAdmin && "👑"}</div>
                <div>{m.text}</div>
                {m.image && <img src={m.image} style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "10px" }} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#383a40", borderRadius: "8px", padding: "0 10px" }}>
            <button onClick={() => chatFileRef.current.click()} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "#b5bac1", cursor: "pointer" }}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder="Message..." />
            <input type="file" ref={chatFileRef} style={{ display: "none" }} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
          </div>
        </div>
      </div>

      {/* ACCOUNT CENTER */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "300px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <h3 style={{margin:0}}>Settings</h3>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <input type="file" ref={pfpFileRef} style={{display:'none'}} onChange={updatePfp} />
            <button onClick={() => pfpFileRef.current.click()} style={{padding:'10px', width:'100%', background:'#5865f2', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Upload PFP</button>
            <div style={{fontSize:'10px', color:'#949ba4'}}>ID: {user.uid}</div>
            <button onClick={() => setShowAcc(false)} style={{color:'#949ba4', background:'none', border:'none', cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
