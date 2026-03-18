import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMIN_PASSWORD = "MANGOMUNCHER93"; // Change this!

export async function GET() {
  try {
    await client.connect();
    const db = client.db("chatdb");
    const msgs = await db.collection("messages").find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs);
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const { text, user, isAdmin } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    await db.collection("messages").insertOne({ 
      text, 
      user, 
      isAdmin: !!isAdmin, // Store if the sender was an admin
      date: new Date() 
    });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req) {
  const pass = req.headers.get("admin-pass");
  if (pass !== ADMIN_PASSWORD) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    await db.collection("messages").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }
}
