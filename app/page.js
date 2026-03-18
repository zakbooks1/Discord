"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [showAcc, setShowAcc] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [regName, setRegName] = useState("");
  const chatFileRef = useRef(null);
  const pfpFileRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("discord_v17");
    if (saved) {
      setUser(JSON.parse(saved));
      setIsLoggedIn(true);
    }
  }, []);

  const createAccount = () => {
    if (!regName) return alert("Name required");
    const newUid = "u_" + Math.random().toString(36).substr(2, 9);
    const data = {
      name: regName,
      uid: newUid,
      pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${regName}`
    };
    setUser(data);
    setIsLoggedIn(true);
    localStorage.setItem("discord_v17", JSON.stringify(data));
  };

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.log("Fetch error"); }
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

    const body = {
      text: msgText,
      user: user.name,
      uid: user.uid,
      pfp: user.pfp,
      image: img,
      server: activeServer
    };

    if (msgText.startsWith("/")) {
      const [cmd, target] = msgText.split(" ");
      if (cmd === "/ban" || cmd === "/unban") {
        body.adminAction = true;
        body.action = cmd.slice(1);
        body.target = target;
      }
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setText(""); loadData();
  };

  // Helper to fix broken images on the fly
  const handleImgError = (e) => {
    e.target.src = "https://api.dicebear.com/7.x/bottts/svg?seed=fallback";
  };

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22', fontFamily:'sans-serif'}}>
        <div style={{background:'#313338', padding:'40px', borderRadius:'8px', width:'320px', display:'flex', flexDirection:'column', gap:'15px'}}>
          <h2 style={{color:'white', textAlign:'center', margin:0}}>Discord Pro</h2>
          <input placeholder="Username" onChange={e => setRegName(e.target.value)} style={{padding:'12px', background:'#1e1f22', border:'none', color:'white', borderRadius:'4px'}} />
          <button onClick={createAccount} style={{padding:'12px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px', fontWeight:'bold', cursor:'pointer'}}>Create Account</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif", overflow: "hidden" }}>
      
      {/* Sidebar */}
      <div style={{ width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>D</div>
        <div onClick={() => setShowAcc(true)} style={{ marginTop: "auto", cursor: "pointer", fontSize: "24px" }}>⚙️</div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", fontWeight: "bold" }}>
          # {activeServer}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
              <img 
                src={m.pfp} 
                onError={handleImgError} 
                style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#1e1f22" }} 
              />
              <div style={{flex: 1}}>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>
                  {m.user} {m.isAdmin && <span style={{fontSize:'10px', background:'#f1c40f', color:'black', padding:'2px 4px', borderRadius:'3px', marginLeft:'5px'}}>STAFF</span>}
                </div>
                <div style={{ color: "#dbdee1" }}>{m.text}</div>
                {m.image && <img src={m.image} style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px", marginTop: "10px" }} />}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 10px" }}>
             <button onClick={() => chatFileRef.current.click()} style={{width:24, height:24, borderRadius:'50%', border:'none', background:'#b5bac1', cursor:'pointer'}}>+</button>
             <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder="Message..." />
             <input type="file" ref={chatFileRef} style={{display:'none'}} onChange={e => {
                const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
             }} />
          </div>
        </div>
      </div>

      {/* Account Center Modal */}
      {showAcc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#313338", padding: "30px", borderRadius: "8px", width: "300px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <h3 style={{color:'white', margin:0}}>Account Center</h3>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'10px', color:'#949ba4'}}>YOUR UNIQUE ID</div>
              <code style={{color:'#f1c40f'}}>{user.uid}</code>
            </div>
            <img src={user.pfp} onError={handleImgError} style={{width:80, height:80, borderRadius:'50%'}} />
            <button onClick={() => {localStorage.clear(); window.location.reload();}} style={{padding:'10px', width:'100%', background:'#ed4245', color:'white', border:'none', borderRadius:'4px', fontWeight:'bold', cursor:'pointer'}}>Logout / Delete</button>
            <button onClick={() => setShowAcc(false)} style={{color:'#949ba4', background:'none', border:'none', cursor:'pointer'}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
