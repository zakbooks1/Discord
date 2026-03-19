import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// --- 1. Login to your app ---
// --- 2. Copy your ID from the Gear icon ---
// --- 3. Paste it here and redeploy to get your Crown ---
const ADMIN_WHITELIST = ["u_3uqqpsixd"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const server = searchParams.get("server") || "general";
  const type = searchParams.get("type");

  try {
    await client.connect();
    const db = client.db("chatdb");
    const isAdmin = ADMIN_WHITELIST.includes(uid);

    // Hard block for staff-room
    if (server === "staff-room" && !isAdmin) {
      return NextResponse.json([{ text: "🔒 Admin Only", user: "System", pfp: "", system: true }]);
    }

    if (type === "servers") {
      const cols = await db.listCollections().toArray();
      const list = cols.map(c => c.name).filter(n => !["users", "blacklist"].includes(n));
      if (!list.includes("staff-room")) list.push("staff-room");
      return NextResponse.json(list);
    }

    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs.map(m => ({
      ...m,
      isAdmin: ADMIN_WHITELIST.includes(m.uid),
      displayUid: isAdmin ? m.uid : null // Only admins see IDs
    })));
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    if (body.action === "auth") {
      const user = await db.collection("users").findOne({ name: body.user });
      if (user) {
        if (user.password === body.password) return NextResponse.json({ success: true, user });
        return NextResponse.json({ error: "Wrong Password" }, { status: 401 });
      }
      const newUser = { 
        name: body.user, password: body.password, 
        uid: "u_" + Math.random().toString(36).slice(2,11),
        pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`
      };
      await db.collection("users").insertOne(newUser);
      return NextResponse.json({ success: true, user: newUser });
    }

    // Admin Commands
    if (body.adminAction && !ADMIN_WHITELIST.includes(body.uid)) return NextResponse.json({ error: "No" }, { status: 403 });
    if (body.adminAction && body.action === "clear") await db.collection(body.server).deleteMany({});

    await db.collection(body.server).insertOne({ ...body, date: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
