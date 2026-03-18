"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cmdHint, setCmdHint] = useState("");
  const [loading, setLoading] = useState(true);

  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  
  const chatFileRef = useRef(null);
  const scrollRef = useRef(null);
  
  const ADMIN_KEY = "67man76";
  const channels = [{ id: "general", icon: "#" }, { id: "media", icon: "📸" }];
  const ADMIN_CMDS = ["/ban", "/unban", "/clear", "/yeet", "/clown"];

  useEffect(() => {
    const saved = localStorage.getItem("chat-v13");
    if (saved) { 
      setUser(JSON.parse(saved)); 
      setIsLoggedIn(true); 
    }
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data.reverse());
      }
      setLoading(false);
    } catch (e) { 
      console.error("Fetch failed");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
      const interval = setInterval(loadData, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, activeServer]);

  const send = async (img = null) => {
    let msgText = text.trim();
    if (!msgText && !img) return;

    if (user.isAdmin && msgText.startsWith("/")) {
      const parts = msgText.split(" ");
      const cmd = parts[0].toLowerCase();
      const target = parts[1];

      if (cmd === "/ban" || cmd === "/unban") {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminAction: true, action: cmd.replace("/",""), target, pass: user.pass })
        });
        msgText = `🛠 Admin ${cmd.replace("/","")}ed ${target || "user"}`;
      } else if (cmd === "/clear") {
        await fetch("/api/messages", { 
          method: "DELETE", 
          headers: { "admin-pass": user.pass }, 
          body: JSON.stringify({ server: activeServer, clearAll: true }) 
        });
        setText(""); loadData(); return;
      }
    }

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: msgText, user: user.name, isAdmin: user.isAdmin, 
        pfp: user.pfp, image: img, server: activeServer 
      }),
    });
    setText(""); loadData();
  };

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', width:'100vw', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22'}}>
        <div style={{background:'#313338', padding:'40px', borderRadius:'8px', width:'300px', display:'flex', flexDirection:'column', gap:'15px'}}>
          <input placeholder="Username" onChange={e => setTempName(e.target.value)} style={{padding:'12px', borderRadius:'4px', border:'none'}} />
          <input placeholder="Admin Pass" type="password" onChange={e => setTempPass(e.target.value)} style={{padding:'12px', borderRadius:'4px', border:'none'}} />
          <button onClick={() => {
            if (!tempName) return alert("Name!");
            const data = { name: tempName, isAdmin: tempPass === ADMIN_KEY, pass: tempPass, pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${tempName}` };
            setUser(data); setIsLoggedIn(true); localStorage.setItem("chat-v13", JSON.stringify(data));
          }} style={{padding:'12px', background:'#5865f2', color:'white', border:'none', borderRadius:'4px'}}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif" }}>
      
      {/* Sidebar */}
      <div style={{ width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>D</div>
        <div onClick={loadData} style={{marginTop:'20px', cursor:'pointer', fontSize:'20px'}}>🔄</div>
        <div onClick={() => {localStorage.clear(); window.location.reload();}} style={{marginTop:'auto', color:'#ed4245', fontSize:'10px', paddingBottom:'10px'}}>LOGOUT</div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #232428", background: "#313338" }}>
          # {activeServer} {user.isAdmin && <span style={{marginLeft:'10px', background:'#f1c40f', color:'black', padding:'2px 6px', borderRadius:'4px', fontSize:'10px'}}>ADMIN</span>}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#313338" }} ref={scrollRef}>
          {loading ? <div style={{textAlign:'center'}}>Loading messages...</div> : 
            messages.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} alt="" />
                <div style={{flex: 1}}>
                  <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</div>
                  <div style={{ color: "#dbdee1" }}>{m.text}</div>
                  {m.image && <img src={m.image} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }} alt="" />}
                </div>
              </div>
            ))
          }
        </div>

        {/* Input area */}
        <div style={{ padding: "20px", background: "#313338" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 15px" }}>
            <input type="file" accept="image/*" ref={chatFileRef} style={{ display: "none" }} onChange={(e) => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => chatFileRef.current.click()} style={{ background: "#b5bac1", border: "none", borderRadius: "50%", width: "24px", height: "24px" }}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
                   style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "transparent", color: "white", outline: "none" }} 
                   placeholder="Message..." />
          </div>
        </div>
      </div>
    </div>
  );
}
