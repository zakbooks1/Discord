import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

// The MASTER_ID - Put your generated ID here once you log in!
const ADMIN_WHITELIST = ["admin_master_77", "your_id_here"]; 

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // 1. Check if the user's Unique ID is banned
    const banned = await db.collection("blacklist").findOne({ uid: body.uid });
    if (banned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    // 2. Security Check: Is this person actually an Admin?
    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);

    // 3. Handle Admin Actions
    if (body.adminAction) {
      if (!isAuthAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      
      if (body.action === "ban") {
        await db.collection("blacklist").updateOne(
          { username: body.target }, 
          { $set: { username: body.target, bannedBy: body.uid } }, 
          { upsert: true }
        );
      } else if (body.action === "unban") {
        await db.collection("blacklist").deleteOne({ username: body.target });
      }
      return NextResponse.json({ success: true });
    }

    // 4. Save Message with UID (UID is hidden from others in the frontend)
    await db.collection(body.server || "general").insertOne({
      text: body.text,
      user: body.user,
      isAdmin: isAuthAdmin, // Server decides if they are admin, not the user
      pfp: body.pfp,
      image: body.image,
      uid: body.uid, // Stored for records, but filtered out in GET usually
      date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") || "general";
  try {
    await client.connect();
    const db = client.db("chatdb");
    // We fetch messages but we don't send the UIDs to the frontend for safety
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    const safeMsgs = msgs.map(({ uid, ...rest }) => rest); // Hide UIDs from everyone
    return NextResponse.json(safeMsgs);
  } catch (e) { return NextResponse.json([]); }
}
