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
    const saved = localStorage.getItem("discord_v19");
    if (saved) { 
      const parsed = JSON.parse(saved);
      if (parsed.uid && parsed.uid !== "u_undefined") {
        setUser(parsed); 
        setIsLoggedIn(true); 
      }
    }
  }, []);

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?server=${activeServer}`);
    const data = await res.json();
    if (Array.isArray(data)) setMessages(data.reverse());
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  const createAccount = () => {
    const name = prompt("Enter Username:");
    if (!name) return;
    // FIXED ID GENERATOR
    const newUid = "u_" + Math.random().toString(36).substring(2, 11);
    const data = { 
      name, 
      uid: newUid, 
      pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}` 
    };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("discord_v19", JSON.stringify(data));
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

  const updatePfp = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...user, pfp: reader.result };
      setUser(updated);
      localStorage.setItem("discord_v19", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
        <button onClick={createAccount} style={{padding:'15px 30px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold'}}>Create Account</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "12px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>D</div>
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428" }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
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
            <button onClick={() => chatFileRef.current.click()} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none" }}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder="Message..." />
            <input type="file" ref={chatFileRef} style={{ display: "none" }} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "300px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%'}} />
            <input type="file" ref={pfpFileRef} style={{display:'none'}} onChange={updatePfp} />
            <button onClick={() => pfpFileRef.current.click()} style={{padding:'10px', width:'100%', background:'#5865f2', color:'white', border:'none', borderRadius:'4px'}}>Upload PFP</button>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'10px', color:'#949ba4'}}>COPY THIS ID FOR ADMIN:</div>
              <code style={{color:'#f1c40f'}}>{user.uid}</code>
            </div>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{color:'#ed4245', background:'none', border:'none', cursor:'pointer'}}>Logout</button>
            <button onClick={() => setShowAcc(false)} style={{background:'none', border:'none', color:'white', cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
