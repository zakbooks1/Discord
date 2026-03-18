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
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { text, user, isAdmin, server, pfp, image } = body;
    
    await client.connect();
    const db = client.db("chatdb");

    // Check if user is banned
    const banned = await db.collection("blacklist").findOne({ username: user });
    if (banned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    const result = await db.collection(server || "general").insertOne({ 
      text, user, isAdmin: Boolean(isAdmin), pfp, image, date: new Date() 
    });

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (e) { 
    console.error("POST ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function DELETE(req) {
  const pass = req.headers.get("admin-pass");
  if (pass !== MASTER_PASS) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, server, clearAll } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    if (clearAll) { await db.collection(server).deleteMany({}); } 
    else { await db.collection(server).deleteOne({ _id: new ObjectId(id) }); }
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }
}
