import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const MASTER_PASS = "67man76";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") || "general";
  try {
    await client.connect();
    const db = client.db("chatdb");
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs);
  } catch (e) { 
    return NextResponse.json([]); 
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // Check for Ban
    const banned = await db.collection("blacklist").findOne({ username: body.user });
    if (banned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    // Handle Admin Actions (Ban/Unban)
    if (body.adminAction && body.pass === MASTER_PASS) {
      if (body.action === "ban") {
        await db.collection("blacklist").updateOne({ username: body.target }, { $set: { username: body.target } }, { upsert: true });
      } else {
        await db.collection("blacklist").deleteOne({ username: body.target });
      }
      return NextResponse.json({ success: true });
    }

    // Save Message
    await db.collection(body.server || "general").insertOne({
      text: body.text || "",
      user: body.user || "Unknown",
      isAdmin: Boolean(body.isAdmin),
      pfp: body.pfp || "",
      image: body.image || null,
      date: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (req.headers.get("admin-pass") !== MASTER_PASS) return NextResponse.json({ status: 401 });
  try {
    const { id, server, clearAll } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    if (clearAll) await db.collection(server).deleteMany({});
    else await db.collection(server).deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ status: 500 }); }
}
