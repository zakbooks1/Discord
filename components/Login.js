"use client";
import { useState } from "react";

export default function Login({ onAuth }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = async () => {
    const res = await fetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({ action: "auth", user: name, password: pass })
    });
    const data = await res.json();
    if (data.success) onAuth(data.user);
    else alert(data.error || "Login failed");
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#313338' }}>
      <div style={{ background: '#1e1f22', padding: '32px', borderRadius: '8px', width: '400px', textAlign: 'center' }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Welcome Back!</h2>
        <input 
          placeholder="Username" 
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: 'none', background: '#383a40', color: 'white' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          onChange={e => setPass(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '4px', border: 'none', background: '#383a40', color: 'white' }}
        />
        <button 
          onClick={handleSubmit}
          style={{ width: '100%', padding: '12px', background: '#5865f2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
