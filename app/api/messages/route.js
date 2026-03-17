import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

// We define the client outside to prevent connection limits
const client = new MongoClient(process.env.MONGODB_URI);

export async function GET() {
  try {
    await client.connect();
    const db = client.db("chatdb");
    const msgs = await db.collection("messages").find().toArray();
    return NextResponse.json(msgs);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { text } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    await db.collection("messages").insertOne({ text, date: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
