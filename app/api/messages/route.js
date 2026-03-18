import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const MASTER_PASS = "67bits67"; 

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const serverName = searchParams.get("server") || "general";
  
  try {
    await client.connect();
    const db = client.db("chatdb");
    // Fetch from the specific collection named after the server
    const msgs = await db.collection(serverName).find().sort({ date: -1 }).limit(100).toArray();
    return NextResponse.json(msgs);
  } catch (e) { 
    return NextResponse.json({ error: "Database error" }, { status: 500 }); 
  }
}

export async function POST(req) {
  try {
    const { text, user, isAdmin, isAnnouncement, server } = await req.json();
    const serverName = server || "general";
    
    await client.connect();
    const db = client.db("chatdb");
    await db.collection(serverName).insertOne({ 
      text, 
      user, 
      isAdmin: !!isAdmin, 
      isAnnouncement: !!isAnnouncement, 
      date: new Date() 
    });
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ error: e.message }, { status: 500 }); 
  }
}

export async function DELETE(req) {
  const pass = req.headers.get("admin-pass");
  if (pass !== MASTER_PASS) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, server, clearAll } = await req.json();
    const serverName = server || "general";
    await client.connect();
    const db = client.db("chatdb");
    
    if (clearAll) {
      await db.collection(serverName).deleteMany({}); 
    } else {
      await db.collection(serverName).deleteOne({ _id: new ObjectId(id) });
    }
    return NextResponse.json({ success: true });
  } catch (e) { 
    return NextResponse.json({ error: "Delete failed" }, { status: 500 }); 
  }
}
