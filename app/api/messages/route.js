import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// --- 1. Login to your app once ---
// --- 2. Copy the ID from the Gear settings (e.g., u_3uqqpsixd) ---
// --- 3. Paste it here to lock the staff room to just you ---
const ADMIN_WHITELIST = ["u_your_actual_id_here"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const server = searchParams.get("server") || "general";

  try {
    await client.connect();
    const db = client.db("chatdb");
    const isAdmin = ADMIN_WHITELIST.includes(uid);

    // CRITICAL: Block regular people from Staff Room
    if (server === "staff-room" && !isAdmin) {
      return NextResponse.json([{ text: "🔒 Staff Only: Access Denied.", user: "System", system: true }]);
    }

    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    
    // Only send user IDs to admins so they can /ban people
    return NextResponse.json(msgs.map(m => ({
      ...m,
      isAdmin: ADMIN_WHITELIST.includes(m.uid),
      displayUid: isAdmin ? m.uid : null 
    })));
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // Handle Auth & Auto-ID generation
    if (body.action === "auth") {
      const user = await db.collection("users").findOne({ name: body.user });
      if (user) {
        if (user.password === body.password) return NextResponse.json({ success: true, user });
        return NextResponse.json({ error: "Wrong Password" }, { status: 401 });
      }
      const newUser = { 
        name: body.user, 
        password: body.password, 
        uid: "u_" + Math.random().toString(36).slice(2,9),
        pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`
      };
      await db.collection("users").insertOne(newUser);
      return NextResponse.json({ success: true, user: newUser });
    }

    // Command Logic
    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);
    if (body.adminAction && !isAuthAdmin) return NextResponse.json({ error: "No" }, { status: 403 });

    await db.collection(body.server).insertOne({ ...body, date: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}
