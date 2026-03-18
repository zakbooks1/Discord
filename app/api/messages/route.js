import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// 1. COPY YOUR ID FROM THE SETTINGS MODAL AND PASTE IT HERE
const ADMIN_WHITELIST = ["u_your_new_id_here"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  try {
    await client.connect();
    const db = client.db("chatdb");
    if (type === "servers") {
      const collections = await db.listCollections().toArray();
      const servers = collections.map(c => c.name).filter(n => !["blacklist", "users"].includes(n));
      return NextResponse.json(servers);
    }
    const server = searchParams.get("server") || "general";
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs.map(({ uid, ...rest }) => rest));
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // Check Whitelist
    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    if (body.action === "create_server" && isAuthAdmin) {
      const newName = body.serverName.toLowerCase().replace(/\s+/g, '-');
      await db.createCollection(newName);
      return NextResponse.json({ success: true });
    }

    if (body.adminAction && isAuthAdmin) {
      if (body.action === "ban") {
        await db.collection("blacklist").updateOne({ username: body.target }, { $set: { banned: true } }, { upsert: true });
      } else {
        await db.collection("blacklist").deleteOne({ username: body.target });
      }
      return NextResponse.json({ success: true });
    }

    await db.collection(body.server || "general").insertOne({
      text: body.text, user: body.user, isAdmin: isAuthAdmin,
      pfp: body.pfp, image: body.image, uid: body.uid, date: new Date()
    });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
