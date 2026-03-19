"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [creds, setCreds] = useState({ name: "", pass: "" });
  const [text, setText] = useState("");

  useEffect(() => {
    // Clear the old 'undefined' data
    const saved = localStorage.getItem("v_final");
    if (saved && !saved.includes("undefined")) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    if (!user) return;
    const res = await fetch(`/api/messages?server=${activeServer}&uid=${user.uid}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data.reverse() : []);
  };

  useEffect(() => { sync(); const i = setInterval(sync, 3000); return () => clearInterval(i); }, [user, activeServer]);

  const handleLogin = async () => {
    const res = await fetch("/api/messages", { method: "POST", body: JSON.stringify({ action: "auth", user: creds.name, password: creds.pass }) });
    const data = await res.json();
    if (data.success) {
      setUser(data.user);
      localStorage.setItem("v_final", JSON.stringify(data.user));
    }
  };

  if (!user) return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white'}}>
      <h2 style={{marginBottom:'20px'}}>Discord Clone Login</h2>
      <input placeholder="Username" onChange={e => setCreds({...creds, name: e.target.value})} style={{padding:'10px', margin:'5px', width:'250px', borderRadius:'5px'}} />
      <input type="password" placeholder="Password" onChange={e => setCreds({...creds, pass: e.target.value})} style={{padding:'10px', margin:'5px', width:'250px', borderRadius:'5px'}} />
      <button onClick={handleLogin} style={{padding:'10px', width:'250px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', marginTop:'10px'}}>Sign In</button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: "#313338", color: "white", fontFamily: "sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: "72px", background: "#1e1f22", display: "flex", flexDirection: "column", gap: "10px", padding: "10px" }}>
        {["general", "staff-room"].map(s => (
          <div key={s} onClick={() => setActiveServer(s)} style={{ width: "48px", height: "48px", borderRadius: "50%", background: activeServer === s ? "#5865f2" : "#313338", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize:'10px' }}>{s.slice(0,2).toUpperCase()}</div>
        ))}
      </div>

      {/* Main Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: "48px", borderBottom: "1px solid #232428", display: "flex", alignItems: "center", padding: "0 15px", fontWeight: "bold" }}># {activeServer}</div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <img src={m.pfp} style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: "bold", color: m.isAdmin ? "#f1c40f" : "white" }}>
                  {m.user} {m.isAdmin && "👑"}
                  {m.displayUid && <span style={{fontSize:'10px', color:'gray', marginLeft:'10px'}}>ID: {m.displayUid}</span>}
                </div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "20px" }}>
          <input onKeyDown={async e => { if (e.key === "Enter") { await fetch("/api/messages", { method: "POST", body: JSON.stringify({ text: e.target.value, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer }) }); e.target.value = ""; sync(); } }} style={{ width: "100%", padding: "12px", background: "#383a40", color: "white", border: "none", borderRadius: "8px" }} placeholder={`Message #${activeServer}...`} />
        </div>
      </div>
    </div>
  );
}
