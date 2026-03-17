import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("chat_database");
    const messages = await db.collection("messages")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json(messages);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { text } = await req.json();
    const client = await clientPromise;
    const db = client.db("chat_database");
    await db.collection("messages").insertOne({
      text,
      createdAt: new Date(),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
