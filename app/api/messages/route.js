import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMIN_WHITELIST = ["u_vhsncg24za"]; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const uid = searchParams.get("uid");
  const server = searchParams.get("server") || "general";

  try {
    await client.connect();
    const db = client.db("chatdb");

    // Block non-admins from the Staff Room
    if (server === "staff-room" && !ADMIN_WHITELIST.includes(uid)) {
      return NextResponse.json([{ text: "⛔ ACCESS DENIED: Admin Only", user: "System", pfp: "" }]);
    }

    if (type === "servers") {
      const cols = await db.listCollections().toArray();
      const servers = cols.map(c => c.name).filter(n => !["blacklist", "users"].includes(n));
      if (!servers.includes("general")) servers.push("general");
      if (!servers.includes("staff-room")) servers.push("staff-room");
      return NextResponse.json(servers);
    }

    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs.map(m => ({ ...m, isAdmin: ADMIN_WHITELIST.includes(m.uid) })));
  } catch (e) { return NextResponse.json(["general"]); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    const isBanned = await db.collection("blacklist").findOne({ uid: body.uid });
    if (isBanned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    if (body.adminAction && isAuthAdmin) {
      if (body.action === "announce") {
        await db.collection(body.server).insertOne({
          text: body.text, user: "📢 ANNOUNCEMENT", isAdmin: true, 
          pfp: "https://api.dicebear.com/7.x/icons/svg?seed=speaker", isAnnounce: true, date: new Date()
        });
        return NextResponse.json({ success: true });
      }
      if (body.action === "ban") await db.collection("blacklist").updateOne({ uid: body.targetUid }, { $set: { uid: body.targetUid } }, { upsert: true });
      if (body.action === "unban") await db.collection("blacklist").deleteOne({ uid: body.targetUid });
      if (body.action === "clear") await db.collection(body.server).deleteMany({});
      return NextResponse.json({ success: true });
    }

    await db.collection(body.server || "general").insertOne({
      ...body, date: new Date(), isAdmin: isAuthAdmin
    });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Fail" }, { status: 500 }); }
}
