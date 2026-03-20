"use client";
import { useEffect, useState } from "react";
import Login from "../components/Login";
import { processCommand } from "../lib/cmds";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [activeServer, setActiveServer] = useState("general");
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("v_final_fixed");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const sync = async () => {
    if (!user || user.uid === "u_undefined") return;
    const res = await fetch(`/api/messages?server=${activeServer}&uid=${user.uid}`);
    const data = await res.json();
    setMessages(Array.isArray(data) ? data.reverse() : []);
  };

  useEffect(() => { sync(); const i = setInterval(sync, 3000); return () => clearInterval(i); }, [user, activeServer]);

  const send = async () => {
    if (!text.trim()) return;
    let body = { text, user: user.name, uid: user.uid, pfp: user.pfp, server: activeServer };
    
    const cmd = processCommand(text, user, activeServer);
    if (cmd) {
      if (cmd.type === "msg") body.text = cmd.text;
      if (cmd.type === "admin") body = { ...body, ...cmd };
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); setSuggestion(""); sync();
  };

  if (!user) return <Login onAuth={setUser} />;

  return (
    <div className="flex h-screen bg-[#313338] text-white font-sans">
      {/* Sidebar */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-3">
        {["GEN", "STA", "ANN", "BRU"].map(s => (
          <div key={s} onClick={() => setActiveServer(s === "STA" ? "staff-room" : s.toLowerCase())} 
               className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${activeServer.includes(s.toLowerCase()) ? "bg-[#5865f2] rounded-2xl" : "bg-[#313338] hover:bg-[#5865f2] hover:rounded-2xl"}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 border-b border-[#232428] flex items-center px-4 font-bold shadow-sm">
          # {activeServer}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 p-2 rounded ${m.isAnnounce ? 'bg-[#5865f2]/10 border-l-4 border-[#5865f2]' : ''}`}>
              <img src={m.pfp || "https://api.dicebear.com/7.x/bottts/svg?seed=fallback"} className="w-10 h-10 rounded-full bg-[#1e1f22]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  {m.isAdmin && <span>👑</span>}
                  {m.displayUid && <span className="text-[10px] text-gray-500">ID: {m.displayUid}</span>}
                </div>
                <div className="text-[#dbdee1] break-words">{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 relative">
          {suggestion && <div className="absolute top-[-30px] left-6 bg-[#5865f2] px-2 py-1 rounded text-xs shadow-lg">{suggestion}</div>}
          <input 
            value={text} 
            onChange={(e) => {
              setText(e.target.value);
              const match = ["/clear", "/announce", "/ban", "/shrug", "/dice", "/flip"].find(c => c.startsWith(e.target.value));
              setSuggestion(match && e.target.value.startsWith("/") ? `Suggest: ${match}` : "");
            }}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="w-full bg-[#383a40] p-3 rounded-lg outline-none focus:ring-2 focus:ring-[#5865f2]"
            placeholder={`Message #${activeServer}...`}
          />
        </div>
      </div>
    </div>
  );
}
