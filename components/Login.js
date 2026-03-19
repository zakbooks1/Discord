"use client";
import { useState } from "react";

export default function Login({ onAuth }) {
  const [creds, setCreds] = useState({ name: "", pass: "" });

  const submit = async () => {
    if (!creds.name || !creds.pass) return alert("Missing fields");
    const res = await fetch("/api/messages", { 
      method: "POST", 
      body: JSON.stringify({ action: "auth", user: creds.name, password: creds.pass }) 
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("v_final_fixed", JSON.stringify(data.user));
      onAuth(data.user);
    } else { alert(data.error); }
  };

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#1e1f22', color:'white'}}>
      <h2 style={{marginBottom:'20px'}}>Discord Login</h2>
      <input placeholder="Username" onChange={e => setCreds({...creds, name: e.target.value})} style={{padding:'12px', margin:'5px', width:'250px', background:'#383a40', color:'white', border:'none', borderRadius:'5px'}} />
      <input type="password" placeholder="Password" onChange={e => setCreds({...creds, pass: e.target.value})} style={{padding:'12px', margin:'5px', width:'250px', background:'#383a40', color:'white', border:'none', borderRadius:'5px'}} />
      <button onClick={submit} style={{padding:'12px', width:'250px', marginTop:'10px', background:'#5865f2', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold', cursor:'pointer'}}>Enter</button>
    </div>
  );
}
