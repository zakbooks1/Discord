import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// I grabbed this from your settings screenshot!
const ADMIN_WHITELIST = ["u_3uqqpsixd"]; 

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // Handle Login/Auth
    if (body.action === "auth") {
      const user = await db.collection("users").findOne({ name: body.user });
      if (user && user.password !== body.password) return NextResponse.json({ error: "Wrong Pass" }, { status: 401 });
      
      const userData = user || { 
        name: body.user, 
        password: body.password, 
        uid: "u_" + Math.random().toString(36).slice(2,11),
        pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`
      };
      if (!user) await db.collection("users").insertOne(userData);
      return NextResponse.json({ success: true, user: userData });
    }

    // Command Security
    const isBoss = ADMIN_WHITELIST.includes(body.uid);
    if (body.adminAction && !isBoss) {
      return NextResponse.json({ error: "Nice try, but you aren't an admin." }, { status: 403 });
    }

    // Execute Admin Actions
    if (body.action === "clear") {
      await db.collection(body.server).deleteMany({});
      return NextResponse.json({ success: true });
    }

    if (body.action === "announce") {
      await db.collection(body.server).insertOne({
        text: body.text, user: "SYSTEM", uid: "system", isAnnounce: true, date: new Date(),
        pfp: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
      });
      return NextResponse.json({ success: true });
    }

    // Standard Message
    await db.collection(body.server).insertOne({ ...body, date: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Error" }, { status: 500 }); }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const server = searchParams.get("server") || "general";

  await client.connect();
  const db = client.db("chatdb");
  const isBoss = ADMIN_WHITELIST.includes(uid);

  if (server === "staff-room" && !isBoss) {
    return NextResponse.json([{ text: "🔒 This room is for Staff Only.", user: "System", system: true }]);
  }

  const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
  return NextResponse.json(msgs.map(m => ({
    ...m,
    isAdmin: ADMIN_WHITELIST.includes(m.uid),
    displayUid: isBoss ? m.uid : null 
  })));
}
