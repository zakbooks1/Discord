import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);

export async function GET() {
  try {
    await client.connect();
    const db = client.db("chatdb");
    // Get last 50 messages, newest first
    const msgs = await db.collection("messages").find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { text, user } = await req.json(); // THIS LINE CAPTURES THE USERNAME
    
    if (!text || !user) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await client.connect();
    const db = client.db("chatdb");
    await db.collection("messages").insertOne({ 
      text, 
      user, 
      date: new Date() 
    });
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
