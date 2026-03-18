"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  
  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);
  const scrollRef = useRef(null);
  
  const ADMIN_KEY = "67man76";
  const channels = [{ id: "general", icon: "#" }, { id: "media", icon: "📸" }];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v9-final");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const handleLogin = () => {
    if (!tempName) return alert("Enter name");
    const isAdm = tempPass.trim() === ADMIN_KEY;
    const data = { 
      name: tempName, isAdmin: isAdm, pass: tempPass, 
      pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${tempName}` 
    };
    setUser(data); setIsLoggedIn(true);
    localStorage.setItem("chat-v9-final", JSON.stringify(data));
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.error("Fetch error"); }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  const send = async (img = null) => {
    if (!text.trim() && !img) return;
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user: user.name, isAdmin: user.isAdmin, pfp: user.pfp, image: img, server: activeServer }),
    });
    setText(""); loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
        <div style={{background:'#313338', padding:'40px', borderRadius:'8px', width:'320px', display:'flex', flexDirection:'column', gap:'15px'}}>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={{padding:'12px', borderRadius:'4px', border:'none'}} />
          <input placeholder="Admin Pass" type="password" onChange={e => setTempPass(e.target.value)} style={{padding:'12px', borderRadius:'4px', border:'none'}} />
          <button onClick={handleLogin} style={{padding:'12px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px', fontWeight:'bold'}}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* SIDEBAR 1 */}
      <div style={{ width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: "15px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "white" }}>D</div>
        <div onClick={() => {localStorage.clear(); window.location.reload();}} style={{marginTop:'auto', cursor:'pointer', fontSize:'12px'}}>Logout</div>
      </div>

      {/* SIDEBAR 2 (The part that was missing) */}
      <div style={{ width: "240px", backgroundColor: "#2b2d31", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "15px", fontWeight: "bold", borderBottom: "1px solid #232428" }}>Channels</div>
        {channels.map(chan => (
          <div key={chan.id} onClick={() => setActiveServer(chan.id)} 
               style={{ padding: "10px", margin: "5px 10px", borderRadius: "4px", cursor: "pointer", backgroundColor: activeServer === chan.id ? "#3f4147" : "transparent" }}>
            {chan.icon} {chan.id}
          </div>
        ))}
      </div>

      {/* MAIN CHAT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold" }}>
          # {activeServer} {user.isAdmin && <span style={{marginLeft:'10px', background:'#f1c40f', color:'black', padding:'2px 5px', borderRadius:'3px', fontSize:'10px'}}>ADMIN</span>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} alt="" />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</div>
                <div>{m.text}</div>
                {m.image && <img src={m.image} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }} alt="" />}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT AREA (The other part that was missing) */}
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" }}>
            <input type="file" accept="image/*" ref={chatFileRef} style={{ display: "none" }} onChange={(e) => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => chatFileRef.current.click()} style={{ background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer" }}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" }} 
                   placeholder={`Message #${activeServer}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
