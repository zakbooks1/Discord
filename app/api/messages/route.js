import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMIN_WHITELIST = ["u_vhsncg24za"]; // REQUIRED: Put your ID here!

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // 1. GLOBAL BAN CHECK: Stop banned UIDs from posting
    const isBanned = await db.collection("blacklist").findOne({ uid: body.uid });
    if (isBanned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    // 2. ADMIN COMMAND LOGIC
    if (body.adminAction && isAuthAdmin) {
      if (body.action === "ban") {
        // Adds the target UID to the blacklist collection
        await db.collection("blacklist").updateOne(
          { uid: body.targetUid }, 
          { $set: { uid: body.targetUid, reason: "Banned by Admin" } }, 
          { upsert: true }
        );
      } 
      else if (body.action === "unban") {
        await db.collection("blacklist").deleteOne({ uid: body.targetUid });
      } 
      else if (body.action === "clear") {
        await db.collection(body.server).deleteMany({});
      }
      return NextResponse.json({ success: true });
    }

    // 3. REGULAR MESSAGE SAVE
    await db.collection(body.server || "general").insertOne({
      text: body.text, user: body.user, pfp: body.pfp, 
      image: body.image, uid: body.uid, date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Fail" }, { status: 500 }); }
}

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
    return NextResponse.json(msgs.map(m => ({ ...m, isAdmin: ADMIN_WHITELIST.includes(m.uid) })));
  } catch (e) { return NextResponse.json(["general"]); }
}
