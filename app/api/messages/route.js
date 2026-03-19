import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// --- CRITICAL: PASTE YOUR ID HERE FROM SETTINGS ---
const ADMIN_WHITELIST = ["u_3uqqpsixd"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const uid = searchParams.get("uid");
  const server = searchParams.get("server") || "general";

  try {
    await client.connect();
    const db = client.db("chatdb");

    // 1. HARD SECURITY: If not admin, block staff-room content completely
    const isAdmin = ADMIN_WHITELIST.includes(uid);
    if (server === "staff-room" && !isAdmin) {
      return NextResponse.json([{ text: "🛑 ACCESS DENIED: Staff Only.", user: "System", pfp: "", system: true }]);
    }

    if (type === "servers") {
      const cols = await db.listCollections().toArray();
      const list = cols.map(c => c.name).filter(n => !["users", "blacklist"].includes(n));
      if (!list.includes("general")) list.push("general");
      if (!list.includes("staff-room")) list.push("staff-room");
      return NextResponse.json(list);
    }

    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    
    // 2. PRIVACY: Only send the 'uid' field to the frontend if the requester is an admin
    return NextResponse.json(msgs.map(m => ({
      ...m,
      isAdmin: ADMIN_WHITELIST.includes(m.uid),
      displayUid: isAdmin ? m.uid : null // Admins see IDs, regular users don't
    })));
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // Handle Auth & Password Registration
    if (body.action === "auth") {
      const user = await db.collection("users").findOne({ name: body.user });
      if (user) {
        if (user.password === body.password) return NextResponse.json({ success: true, user });
        return NextResponse.json({ error: "Incorrect Password" }, { status: 401 });
      }
      const newUser = { 
        name: body.user, 
        password: body.password, 
        uid: "u_" + Math.random().toString(36).slice(2,11),
        pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`
      };
      await db.collection("users").insertOne(newUser);
      return NextResponse.json({ success: true, user: newUser });
    }

    // Admin Command Logic
    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);
    if (body.adminAction && !isAuthAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    if (body.adminAction) {
      if (body.action === "clear") await db.collection(body.server).deleteMany({});
      if (body.action === "ban") await db.collection("blacklist").insertOne({ uid: body.targetUid });
      return NextResponse.json({ success: true });
    }

    await db.collection(body.server).insertOne({ ...body, date: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
