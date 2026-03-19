"use client";
import { useEffect, useState } from "react";
import Login from "../components/Login";
import { handleCommand } from "../lib/commands";

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
    const cmdResult = handleCommand(text, user, activeServer);

    if (cmdResult) {
      if (cmdResult.type === "msg") body.text = cmdResult.text;
      if (cmdResult.type === "cmd") body = { ...body, ...cmdResult };
    }

    await fetch("/api/messages", { method: "POST", body: JSON.stringify(body) });
    setText(""); setSuggestion(""); sync();
  };

  if (!user) return <Login onAuth={setUser} />;

  return (
    <div className="flex h-screen bg-[#313338] text-white">
      {/* Sidebar and Chat code here... */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className="mb-4 flex gap-3">
              <img src={m.pfp} className="w-10 h-10 rounded-full" />
              <div>
                <div className="font-bold">
                  {m.user} {m.isAdmin && "👑"}
                  {m.displayUid && <span className="text-xs text-gray-500 ml-2">ID: {m.displayUid}</span>}
                </div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 relative">
          {text.startsWith("/") && suggestion && (
            <div className="absolute top-[-30px] left-4 bg-[#5865f2] px-2 py-1 rounded text-xs animate-bounce">
              {suggestion}
            </div>
          )}
          <input 
            value={text} 
            onChange={(e) => {
              setText(e.target.value);
              const cmds = ["/clear", "/announce", "/ban", "/shrug", "/dice"];
              const match = cmds.find(c => c.startsWith(e.target.value));
              setSuggestion(match ? `Press Enter for ${match}` : "");
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
