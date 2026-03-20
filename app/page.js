"use client";
import { useEffect, useState } from "react";
import { runCmd } from "../lib/cmds";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("v_final_fixed");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    if (!user) return;
    const res = await fetch(`/api/messages?server=${activeServer}&uid=${user.uid}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data.reverse() : []);
  };

  useEffect(() => { sync(); const i = setInterval(sync, 4000); return () => clearInterval(i); }, [user, activeServer]);

  const send = async () => {
    if (!text.trim()) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    const cmd = runCmd(text);
    if (cmd) {
      if (cmd.type === "msg") body.text = cmd.text;
      else body = { ...body, ...cmd };
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); sync();
  };

  if (!user) return <div style={{background:'#1e1f22', height:'100vh', color:'white', padding:'50px', textAlign:'center'}}>Please Login to Continue</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#313338', color: '#dbdee1', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '72px', background: '#1e1f22', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: '8px' }}>
        {['GEN', 'STA'].map(s => (
          <div key={s} onClick={() => setActiveServer(s === 'STA' ? 'staff-room' : 'general')}
               style={{ width: '48px', height: '48px', borderRadius: activeServer.includes(s.toLowerCase()) ? '16px' : '50%', background: '#313338', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
            {s}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: '48px', borderBottom: '1px solid #232428', display: 'flex', alignItems: 'center', padding: '0 16px', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
          # {activeServer}
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px', padding: m.isAnnounce ? '10px' : '0', background: m.isAnnounce ? 'rgba(88,101,242,0.1)' : 'transparent', borderLeft: m.isAnnounce ? '4px solid #5865f2' : 'none' }}>
              <img src={m.pfp} style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold', color: m.isAdmin ? '#f1c40f' : 'white' }}>{m.user}</span>
                  {m.isAdmin && <span>👑</span>}
                  {m.displayUid && <span style={{ fontSize: '10px', color: '#949ba4' }}>ID: {m.displayUid}</span>}
                </div>
                <div style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>
                  {m.text}
                  {/* Image Scaling Fix for Screenshot 4 and 5 */}
                  {m.text.includes("http") && <img src={m.text} style={{ display:'block', maxWidth:'300px', borderRadius:'8px', marginTop:'8px' }} />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          <input 
            value={text} 
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={{ width: '100%', background: '#383a40', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', outline: 'none' }}
            placeholder={`Message #${activeServer}...`}
          />
        </div>
      </div>
    </div>
  );
}
