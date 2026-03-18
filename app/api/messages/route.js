import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMIN_PASSWORD = "BRUH67MAN"; // CHANGE THIS TO YOUR PASSWORD

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") || "general";
  
  try {
    await client.connect();
    const db = client.db("chatdb");
    // Only fetch messages for the specific server selected
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs);
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const { text, user, isAdmin, server } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    await db.collection(server || "general").insertOne({ 
      text, user, isAdmin, date: new Date() 
    });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req) {
  const pass = req.headers.get("admin-pass");
  if (pass !== ADMIN_PASSWORD) return NextResponse.json({ error: "Wrong Pass" }, { status: 401 });

  try {
    const { id, server } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    await db.collection(server).deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Delete failed" }, { status: 500 }); }
}
