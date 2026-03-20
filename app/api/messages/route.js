import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { handleCommand } from "/lib/cmds";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMINS = ["u_3uqqpsixd", "u_ijlemgdr"]; 

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // --- AUTH LOGIC ---
    if (body.action === "auth") {
      const user = await db.collection("users").findOne({ name: body.user });
      if (user && user.password !== body.password) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const userData = user || { 
        name: body.user, password: body.password, 
        uid: "u_" + Math.random().toString(36).slice(2,11),
        pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`
      };
      if (!user) await db.collection("users").insertOne(userData);
      return NextResponse.json({ success: true, user: userData });
    }

    const isBoss = ADMINS.includes(body.uid);
    const powerLevel = isBoss ? 100 : 0;

    // --- COMMAND INTERCEPTOR ---
    if (body.text && body.text.startsWith("/")) {
      const result = handleCommand(body.text, { id: body.uid, username: body.user, powerLevel });

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }

      // Handle Database side-effects for commands
      if (body.text.startsWith("/clear") && isBoss) {
        await db.collection(body.server || "general").deleteMany({});
      }

      // Create the system response to show in chat
      const systemMsg = {
        text: result.content,
        user: "SYSTEM",
        uid: "system",
        date: new Date(),
        system: true,
        color: result.color || "#7289da",
        pfp: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png"
      };

      await db.collection(body.server || "general").insertOne(systemMsg);
      return NextResponse.json({ success: true });
    }

    // --- STANDARD ACTIONS ---
    if (body.adminAction && !isBoss) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (body.action === "clear") {
      await db.collection(body.server).deleteMany({});
    } else {
      await db.collection(body.server || "general").insertOne({ 
        ...body, 
        date: new Date(), 
        isAdmin: isBoss 
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ error: "Error" }, { status: 500 }); 
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const server = searchParams.get("server") || "general";
  await client.connect();
  const db = client.db("chatdb");
  const isBoss = ADMINS.includes(uid);

  if (server === "staff-room" && !isBoss) {
    return NextResponse.json([{ text: "🔒 Access Denied: Staff Only", user: "System", system: true }]);
  }

  const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
  return NextResponse.json(msgs.map(m => ({ 
    ...m, 
    isAdmin: ADMINS.includes(m.uid),
    displayUid: isBoss ? m.uid : null 
  })));
}
