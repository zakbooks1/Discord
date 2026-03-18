"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState({ name: "", isAdmin: false, pass: "", pfp: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPass, setTempPass] = useState("");
  
  const chatFileRef = useRef(null);
  const scrollRef = useRef(null);
  const ADMIN_KEY = "67man76";

  useEffect(() => {
    const saved = localStorage.getItem("chat_v14");
    if (saved) { setUser(JSON.parse(saved)); setIsLoggedIn(true); }
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/messages?server=${activeServer}`);
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data.reverse());
    } catch (e) { console.log("Load error"); }
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
        msgText = `📢 Admin ${cmd.slice(1)}ed ${target}`;
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

  if (!isLoggedIn) {
    return (
      <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white', fontFamily:'sans-serif'}}>
        <div style={{background:'#313338', padding:'30px', borderRadius:'8px', width:'300px', display:'flex', flexDirection:'column', gap:'10px'}}>
          <h2 style={{textAlign:'center'}}>Login</h2>
          <input placeholder="Name" onChange={e => setTempName(e.target.value)} style={{padding:'10px', borderRadius:'4px'}} />
          <input placeholder="Password" type="password" onChange={e => setTempPass(e.target.value)} style={{padding:'10px', borderRadius:'4px'}} />
          <button onClick={() => {
            const data = { name: tempName, isAdmin: tempPass === ADMIN_KEY, pass: tempPass, pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${tempName}` };
            setUser(data); setIsLoggedIn(true); localStorage.setItem("chat_v14", JSON.stringify(data));
          }} style={{padding:'10px', background:'#5865f2', border:'none', color:'white', fontWeight:'bold', cursor:'pointer'}}>Join</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", backgroundColor: "#313338", color: "#dbdee1", fontFamily: "sans-serif", overflow: "hidden" }}>
      <div style={{ width: "72px", backgroundColor: "#1e1f22", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "#5865f2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>D</div>
        <div onClick={() => {localStorage.clear(); window.location.reload();}} style={{marginTop:'auto', cursor:'pointer', color:'#ed4245', fontSize:'10px'}}>EXIT</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: "48px", padding: "0 16px", display: "flex", alignItems: "center", borderBottom: "1px solid #232428", fontWeight: "bold" }}>
          # {activeServer} {user.isAdmin && <span style={{marginLeft:'10px', color:'#f1c40f', fontSize:'10px'}}>👑 ADMIN</span>}
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

        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#383a40", borderRadius: "8px", padding: "0 10px" }}>
            <input type="file" ref={chatFileRef} style={{display:'none'}} onChange={e => {
              const r = new FileReader(); r.onloadend = () => send(r.result); r.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={() => chatFileRef.current.click()} style={{width:24, height:24, borderRadius:'50%', border:'none', cursor:'pointer'}}>+</button>
            <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} 
                   style={{ flex: 1, padding: "12px", background: "transparent", border: "none", color: "white", outline: "none" }} placeholder="Message..." />
          </div>
        </div>
      </div>
    </div>
  );
}
