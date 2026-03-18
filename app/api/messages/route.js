import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
// ADD YOUR UID HERE TO BE ADMIN AUTOMATICALLY
const ADMIN_WHITELIST = ["admin_master_77", "u_your_id_here"]; 

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    const banned = await db.collection("blacklist").findOne({ uid: body.uid });
    if (banned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    if (body.adminAction) {
      if (!isAuthAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (body.action === "ban") {
        await db.collection("blacklist").updateOne({ username: body.target }, { $set: { username: body.target, uid: body.targetUid } }, { upsert: true });
      } else if (body.action === "unban") {
        await db.collection("blacklist").deleteOne({ username: body.target });
      }
      return NextResponse.json({ success: true });
    }

    // FALLBACK: If pfp is missing or broken, use a default robot avatar
    const safePfp = body.pfp && body.pfp.startsWith("data:image") 
      ? body.pfp 
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`;

    await db.collection(body.server || "general").insertOne({
      text: body.text,
      user: body.user,
      isAdmin: isAuthAdmin,
      pfp: safePfp,
      image: body.image,
      uid: body.uid,
      date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") || "general";
  try {
    await client.connect();
    const db = client.db("chatdb");
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    // Remove UIDs from the public feed for security
    const safeMsgs = msgs.map(({ uid, ...rest }) => rest);
    return NextResponse.json(safeMsgs);
  } catch (e) { return NextResponse.json([]); }
}
