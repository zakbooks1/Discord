import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// PASTE YOUR ID FROM SETTINGS HERE
const ADMIN_WHITELIST = ["u_mepenrgrqk"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  try {
    await client.connect();
    const db = client.db("chatdb");

    if (type === "servers") {
      const collections = await db.listCollections().toArray();
      const servers = collections.map(c => c.name).filter(n => !["blacklist", "users"].includes(n));
      // Ensure "general" always exists in the list
      if (!servers.includes("general")) servers.push("general");
      return NextResponse.json(servers);
    }

    const server = searchParams.get("server") || "general";
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs.map(({ uid, ...rest }) => ({
      ...rest,
      isAdmin: ADMIN_WHITELIST.includes(uid) // Server-side verification
    })));
  } catch (e) { return NextResponse.json(["general"]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.uid || body.uid === "u_undefined") return NextResponse.json({ error: "Invalid UID" }, { status: 400 });
    
    await client.connect();
    const db = client.db("chatdb");

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    if (body.action === "create_server" && isAuthAdmin) {
      const newName = body.serverName.toLowerCase().replace(/\s+/g, '-');
      await db.createCollection(newName);
      return NextResponse.json({ success: true });
    }

    // Message Logic
    await db.collection(body.server || "general").insertOne({
      text: body.text || "",
      user: body.user || "Unknown",
      pfp: body.pfp || "",
      image: body.image || null,
      uid: body.uid,
      date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
