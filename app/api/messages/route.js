import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMIN_WHITELIST = ["u_your_id_here"]; // Put your ID from Account Center here!

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // Check if we want servers or messages
  
  try {
    await client.connect();
    const db = client.db("chatdb");

    if (type === "servers") {
      const collections = await db.listCollections().toArray();
      // Filter out system collections
      const servers = collections
        .map(c => c.name)
        .filter(n => n !== "blacklist" && n !== "users");
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

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    // ACTION: Create Server
    if (body.action === "create_server") {
      if (!isAuthAdmin) return NextResponse.json({ error: "No" }, { status: 401 });
      const newName = body.serverName.toLowerCase().replace(/\s+/g, '-');
      await db.createCollection(newName);
      return NextResponse.json({ success: true });
    }

    // ACTION: Admin Tools
    if (body.adminAction && isAuthAdmin) {
      if (body.action === "ban") {
        await db.collection("blacklist").updateOne({ username: body.target }, { $set: { uid: body.targetUid } }, { upsert: true });
      } else {
        await db.collection("blacklist").deleteOne({ username: body.target });
      }
      return NextResponse.json({ success: true });
    }

    // Regular Message
    const safePfp = body.pfp || `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`;
    await db.collection(body.server || "general").insertOne({
      text: body.text, user: body.user, isAdmin: isAuthAdmin,
      pfp: safePfp, image: body.image, uid: body.uid, date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
