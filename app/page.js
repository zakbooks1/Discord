"use client";
import { useEffect, useState, useRef } from "react";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [username, setUsername] = useState("");
  const scrollRef = useRef(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) {
        // We reverse them here so the newest are at the bottom for the chat feel
        setMessages(data.reverse());
      }
    } catch (e) { console.log("Load error"); }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const send = async () => {
    if (!text || !username) return;

    const response = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, user: username }),
    });

    if (response.ok) {
      setText("");
      loadData();
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - Discord Style */}
      <div style={styles.sidebar}>
        <div style={styles.serverIcon}>M</div>
        <div style={styles.divider} />
        <div style={styles.statusDot} />
      </div>

      {/* Main Chat Area */}
      <div style={styles.chatArea}>
        <div style={styles.header}>
          <span style={styles.hashtag}>#</span> general-chat
        </div>

        <div style={styles.messageList} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={styles.messageRow}>
              <div style={styles.avatar}>
                {m.user ? m.user[0].toUpperCase() : "?"}
              </div>
              <div style={styles.messageContent}>
                <div style={styles.messageHeader}>
                  <span style={styles.username}>{m.user}</span>
                  <span style={styles.timestamp}>Today at {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={styles.messageText}>{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          <input 
            placeholder="Set Username first..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.usernameInput}
          />
          <div style={styles.inputWrapper}>
            <input 
              placeholder={`Message #general-chat`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={styles.mainInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#313338",
    color: "#dbdee1",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  },
  sidebar: {
    width: "72px",
    backgroundColor: "#1e1f22",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "12px",
    gap: "8px",
  },
  serverIcon: {
    width: "48px",
    height: "48px",
    backgroundColor: "#5865f2",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "20px",
  },
  divider: {
    width: "32px",
    height: "2px",
    backgroundColor: "#35363c",
    margin: "4px 0",
  },
  statusDot: {
    width: "48px",
    height: "48px",
    backgroundColor: "#35363c",
    borderRadius: "50%",
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    height: "48px",
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    fontWeight: "bold",
    borderBottom: "1px solid #26272d",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  hashtag: {
    color: "#80848e",
    fontSize: "24px",
    marginRight: "8px",
    fontWeight: "normal",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 0",
    display: "flex",
    flexDirection: "column",
  },
  messageRow: {
    display: "flex",
    padding: "8px 16px",
    gap: "16px",
    transition: "background 0.1s",
  },
  avatar: {
    width: "40px",
    height: "40px",
    backgroundColor: "#eb459e",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    flexShrink: 0,
  },
  messageContent: {
    display: "flex",
    flexDirection: "column",
  },
  messageHeader: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  },
  username: {
    fontWeight: "600",
    color: "#f2f3f5",
    fontSize: "16px",
  },
  timestamp: {
    fontSize: "12px",
    color: "#949ba4",
  },
  messageText: {
    color: "#dbdee1",
    lineHeight: "1.375rem",
    marginTop: "2px",
  },
  inputContainer: {
    padding: "0 16px 24px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  usernameInput: {
    width: "150px",
    background: "#1e1f22",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    color: "#dbdee1",
    fontSize: "12px",
  },
  inputWrapper: {
    backgroundColor: "#383a40",
    borderRadius: "8px",
    padding: "11px 16px",
  },
  mainInput: {
    width: "100%",
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#dbdee1",
    fontSize: "16px",
  }
};
