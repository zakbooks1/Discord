import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const MASTER_PASS = "67boy93";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const server = searchParams.get("server") || "general";
  try {
    await client.connect();
    const db = client.db("chatdb");
    const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
    return NextResponse.json(msgs);
  } catch (e) { return NextResponse.json([]); }
}

export async function POST(req) {
  try {
    const { text, user, isAdmin, server, pfp, image } = await req.json();
    await client.connect();
    const db = client.db("chatdb");
    
    // Simple block check
    const banned = await db.collection("blacklist").findOne({ username: user });
    if (banned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    await db.collection(server || "general").insertOne({ 
      text, user, isAdmin, pfp, image, date: new Date() 
    });
    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "File too large or error" }, { status: 500 }); }
}

// ... keep your DELETE function from the previous script ...
