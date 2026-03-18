"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [servers, setServers] = useState(["general"]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [showAcc, setShowAcc] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("discord_v21");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.uid && parsed.uid !== "u_undefined") setUser(parsed);
    }
    setIsReady(true);
  }, []);

  const sync = async () => {
    try {
      const [sRes, mRes] = await Promise.all([
        fetch("/api/messages?type=servers"),
        fetch(`/api/messages?server=${activeServer}`)
      ]);
      const sData = await sRes.json();
      const mData = await mRes.json();
      if (Array.isArray(sData)) setServers(sData);
      if (Array.isArray(mData)) setMessages(mData.reverse());
    } catch (e) { console.log("sync error"); }
  };

  useEffect(() => {
    if (user) {
      sync();
      const interval = setInterval(sync, 3500);
      return () => clearInterval(interval);
    }
  }, [user, activeServer]);

  const createAcc = () => {
    const name = prompt("Username?");
    if (!name) return;
    const uid = "u_" + Math.random().toString(36).substring(2, 12);
    const data = { name, uid, pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}` };
    localStorage.setItem("discord_v21", JSON.stringify(data));
    setUser(data);
  };

  const handlePfp = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...user, pfp: reader.result };
      setUser(updated);
      localStorage.setItem("discord_v21", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  const addServer = async () => {
    const name = prompt("New server name:");
    if (!name) return;
    await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ action: "create_server", name, uid: user.uid })
    });
    sync();
  };

  const send = async (img = null) => {
    if (!text.trim() && !img) return;
    
    const body = { text, user: user.name, uid: user.uid, pfp: user.pfp, image: img, server: activeServer };
    
    if (text.startsWith("/clear")) {
      body.adminAction = true; body.action = "clear";
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!isReady) return null;
  if (!user) return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
      <button onClick={createAcc} style={{padding:'15px 30px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold'}}>Join Chat</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s} onClick={() => setActiveServer(s)} 
               style={{ width: "48px", height: "48px", borderRadius: activeServer === s ? "16px" : "50%", background: activeServer === s ? "#5865f2" : "#313338", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'10px' }}>
            {s.toUpperCase().slice(0,3)}
          </div>
        ))}
        <div onClick={addServer} style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#23a559", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'24px' }}>+</div>
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428" }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background:'#1e1f22' }} />
              <div style={{flex:1}}>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user} {m.isAdmin && "👑"}</div>
                <div>{m.text}</div>
                {m.image && <img src={m.image} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }} />}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#383a40", borderRadius: "8px", padding: "0 10px" }}>
            <button onClick={() => chatFileRef.current.click()} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none" }}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder="Message..." />
            <input type="file" ref={chatFileRef} style={{ display: "none" }} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
          </div>
        </div>
      </div>

      {/* SETTINGS */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "320px", display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <input type="file" ref={pfpFileRef} style={{display:'none'}} onChange={handlePfp} />
            <button onClick={() => pfpFileRef.current.click()} style={{padding:'10px', width:'100%', background:'#5865f2', color:'white', border:'none', borderRadius:'4px'}}>Change PFP</button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR ADMIN ID:</div>
              <code style={{color:'#f1c40f'}}>{user.uid}</code>
            </div>
            <button onClick={() => setShowAcc(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
