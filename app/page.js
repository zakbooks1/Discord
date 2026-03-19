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
    if (!user) return;
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
    <div className="flex h-screen bg-[#313338] text-white">
      {/* Sidebar logic... */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 mb-4 ${m.isAnnounce ? 'bg-blue-500/10 p-2 border-l-4 border-blue-500' : ''}`}>
              <img src={m.pfp} className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span style={{ color: m.isAdmin ? "#f1c40f" : "white" }}>{m.user}</span>
                  {m.isAdmin && "👑"}
                  {m.displayUid && <span className="text-[10px] text-gray-500 font-normal">ID: {m.displayUid}</span>}
                </div>
                <div className="text-[#dbdee1]">{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 relative">
          {suggestion && (
            <div className="absolute top-[-35px] left-6 bg-[#5865f2] px-3 py-1 rounded text-sm shadow-xl animate-pulse">
              {suggestion}
            </div>
          )}
          <input 
            value={text} 
            onChange={(e) => {
              setText(e.target.value);
              const list = ["/clear", "/announce", "/ban", "/shrug", "/dice"];
              const match = list.find(c => c.startsWith(e.target.value));
              setSuggestion(match && e.target.value.startsWith("/") ? `Use ${match}` : "");
            }}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="w-full bg-[#383a40] p-3 rounded-lg outline-none"
            placeholder={`Message #${activeServer}...`}
          />
        </div>
      </div>
    </div>
  );
}
