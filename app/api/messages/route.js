import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return NextResponse.json({ error: "No URI" }, { status: 500 });

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("chatdb");
    const msgs = await db.collection("messages").find().toArray();
    return NextResponse.json(msgs);
  } catch (e) {
    return NextResponse.json([]);
  } finally {
    await client.close();
  }
}

export async function POST(req) {
  const { text } = await req.json();
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("chatdb");
    await db.collection("messages").insertOne({ text, date: new Date() });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    await client.close();
  }
}
