"use client";
import { useEffect, useState } from "react";
import { runCmd } from "../lib/cmds";
import Login from "../components/Login"; // Ensure this file exists!

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("v_final_fixed");
    // Only set user if the saved data is valid and not "undefined"
    if (saved && saved !== "undefined") {
      setUser(JSON.parse(saved));
    }
    setLoading(false);
  }, []);

  const sync = async () => {
    if (!user || user.uid === "u_undefined") return;
    const res = await fetch(`/api/messages?server=${activeServer}&uid=${user.uid}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data.reverse() : []);
  };

  useEffect(() => { 
    if (user) {
      sync(); 
      const i = setInterval(sync, 4000); 
      return () => clearInterval(i); 
    }
  }, [user, activeServer]);

  const send = async () => {
    if (!text.trim()) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    const cmd = runCmd(text, user);
    if (cmd) {
      if (cmd.type === "msg") body.text = cmd.text;
      else body = { ...body, ...cmd };
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  const handleLogout = () => {
    localStorage.removeItem("v_final_fixed");
    setUser(null);
  };

  if (loading) return <div style={{background:'#313338', height:'100vh'}} />;

  // This brings back the Login screen if you aren't logged in
  if (!user) return <Login onAuth={(u) => {
    setUser(u);
    localStorage.setItem("v_final_fixed", JSON.stringify(u));
  }} />;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#313338', color: '#dbdee1' }}>
      {/* Sidebar */}
      <div style={{ width: '72px', background: '#1e1f22', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '8px' }}>
        {['GEN', 'STA'].map(s => (
          <div key={s} onClick={() => setActiveServer(s === 'STA' ? 'staff-room' : 'general')}
               style={{ width: '48px', height: '48px', borderRadius: activeServer.includes(s.toLowerCase()) ? '16px' : '50%', background: '#313338', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
            {s}
          </div>
        ))}
        <div onClick={handleLogout} style={{ marginTop: 'auto', marginBottom: '20px', cursor: 'pointer', opacity: 0.5 }}>🚪</div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: '48px', borderBottom: '1px solid #232428', display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 'bold' }}>
          # {activeServer}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <img src={m.pfp} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: m.isAdmin ? '#f1c40f' : 'white' }}>{m.user}</span>
                  {m.
