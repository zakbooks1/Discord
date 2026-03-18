import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// 1. ADD YOUR ID HERE FROM SETTINGS
const ADMIN_WHITELIST = ["u_vhsncg24za"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  try {
    await client.connect();
    const db = client.db("chatdb");

    if (type === "servers") {
      const cols = await db.listCollections().toArray();
      const servers = cols.map(c => c.name).filter(n => !["blacklist", "users"].includes(n));
      if (!servers.includes("general")) servers.push("general");
      return NextResponse.json(servers);
    }

    const server = searchParams.get("server") || "general";
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    
    // Server-side Admin Check: If their UID is in our list, they get the crown
    return NextResponse.json(msgs.map(({ uid, ...rest }) => ({
      ...rest,
      isAdmin: ADMIN_WHITELIST.includes(uid)
    })));
  } catch (e) { return NextResponse.json(["general"]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    // Create Server Command
    if (body.action === "create_server" && isAuthAdmin) {
      const name = body.name.toLowerCase().replace(/\s+/g, '-');
      await db.createCollection(name);
      return NextResponse.json({ success: true });
    }

    // Admin Commands (Ban/Clear)
    if (body.adminAction && isAuthAdmin) {
      if (body.action === "clear") {
        await db.collection(body.server).deleteMany({});
      } else if (body.action === "ban") {
        await db.collection("blacklist").insertOne({ targetUid: body.targetUid });
      }
      return NextResponse.json({ success: true });
    }

    // Standard Message
    await db.collection(body.server || "general").insertOne({
      text: body.text, user: body.user, pfp: body.pfp, 
      image: body.image, uid: body.uid, date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Fail" }, { status: 500 }); }
}
