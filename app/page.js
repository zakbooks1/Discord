"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAcc, setShowAcc] = useState(false);
  
  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  
  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);
  const scrollRef = useRef(null);
  const ADMIN_KEY = "67man76";

  const servers = [
    { id: "general", icon: "💬", name: "General" },
    { id: "media", icon: "🖼️", name: "Media" },
    { id: "admin-only", icon: "🔐", name: "Staff" }
  ];

  useEffect(() => {
    const saved = localStorage.getItem("chat_v15");
    if (saved) { 
      const parsed = JSON.parse(saved);
      // Auto-Admin check
      parsed.isAdmin = parsed.pass === ADMIN_KEY;
      setUser(parsed); 
      setIsLoggedIn(true); 
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.log("error"); }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  const send = async (img = null) => {
    let msgText = text.trim();
    if (!msgText && !img) return;

    if (user.isAdmin && msgText.startsWith("/")) {
      const [cmd, target] = msgText.toLowerCase().split(" ");
      if (cmd === "/ban" || cmd === "/unban") {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminAction: true, action: cmd.slice(1), target, pass: user.pass })
        });
        msgText = `🛠️ Admin ${cmd.slice(1)}ed ${target}`;
      } else if (cmd === "/clear") {
        await fetch("/api/messages", { method: "DELETE", headers: { "admin-pass": user.pass }, body: JSON.stringify({ server: activeServer, clearAll: true }) });
        setText(""); loadData(); return;
      }
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: msgText, user: user.name, isAdmin: user.isAdmin, pfp: user.pfp, image: img, server: activeServer }),
    });
    setText(""); loadData();
  };

  const updatePfp = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = { ...user, pfp: reader.result };
      setUser(updated);
      localStorage.setItem("chat_v15", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
  };

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22', fontFamily:'sans-serif'}}>
        <div style={{background:'#313338', padding:'30px', borderRadius:'8px', width:'300px', display:'flex', flexDirection:'column', gap:'10px'}}>
          <h2 style={{color:'white', textAlign:'center'}}>Discord Pro</h2>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={{padding:'12px', borderRadius:'4px', border:'none'}} />
          <input placeholder="Password" type="password" onChange={e => setTempPass(e.target.value)} style={{padding:'12px', borderRadius:'4px', border:'none'}} />
          <button onClick={() => {
            const data = { name: tempName, isAdmin: tempPass === ADMIN_KEY, pass: tempPass, pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${tempName}` };
            setUser(data); setIsLoggedIn(true); localStorage.setItem("chat_v15", JSON.stringify(data));
          }} style={{padding:'12px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px', fontWeight:'bold'}}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* Server List Sidebar */}
      <div style={{ width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "10px" }}>
        {servers.map(s => (
          <div key={s.id} onClick={() => setActiveServer(s.id)} 
               style={{ width: "48px", height: "48px", borderRadius: activeServer === s.id ? "16px" : "50%", backgroundColor: activeServer === s.id ? "#5865f2" : "#313338", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.2s", fontSize: "20px" }}>
            {s.icon}
          </div>
        ))}
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        
        {/* Header */}
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold", background: "#313338" }}>
          # {activeServer} {user.isAdmin && <span style={{marginLeft:'8px', color:'#f1c40f', fontSize:'12px'}}>👑 ADMIN</span>}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#313338" }} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1e1f22" }} alt="" />
              <div style={{flex: 1}}>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</div>
                <div style={{ color: "#dbdee1", wordBreak: "break-word" }}>{m.text}</div>
                {m.image && <img src={m.image} style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", marginTop: "10px" }} alt="" />}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Input Area */}
        <div style={{ padding: "20px", background: "#313338" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 10px" }}>
            <input type="file" ref={chatFileRef} style={{display:'none'}} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => chatFileRef.current.click()} style={{width:24, height:24, borderRadius:'50%', border:'none', cursor:'pointer', background:'#b5bac1', fontWeight:'bold'}}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} 
                   style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder={`Message #${activeServer}`} />
          </div>
        </div>
      </div>

      {/* Account Center Overlay */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", width: "300px" }}>
            <h3 style={{color:'white', margin:0}}>Account Center</h3>
            <img src={user.pfp} style={{width:80, height:80, borderRadius:'50%', border:'2px solid #5865f2'}} />
            <input type="file" ref={pfpFileRef} style={{display:'none'}} onChange={updatePfp} />
            <button onClick={() => pfpFileRef.current.click()} style={{padding:'10px', width:'100%', borderRadius:'4px', border:'none', background:'#5865f2', color:'white', cursor:'pointer'}}>Change PFP</button>
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{padding:'10px', width:'100%', borderRadius:'4px', border:'none', background:'#ed4245', color:'white', cursor:'pointer'}}>Logout</button>
            <button onClick={() => setShowAcc(false)} style={{color:'#949ba4', cursor:'pointer', background:'none', border:'none'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
