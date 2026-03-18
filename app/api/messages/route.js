import { MongoClient, ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const MASTER_PASS = "67man76";

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // 1. Check if user is globally banned
    const isBanned = await db.collection("blacklist").findOne({ username: body.user });
    if (isBanned) {
      return NextResponse.json({ error: "You are banned from this server." }, { status: 403 });
    }

    // 2. Handle Admin Ban/Unban Commands
    if (body.adminAction && body.pass === MASTER_PASS) {
      if (body.action === "ban") {
        await db.collection("blacklist").updateOne(
          { username: body.target },
          { $set: { username: body.target, date: new Date() } },
          { upsert: true }
        );
        return NextResponse.json({ success: true, msg: "User Banned" });
      }
      if (body.action === "unban") {
        await db.collection("blacklist").deleteOne({ username: body.target });
        return NextResponse.json({ success: true, msg: "User Unbanned" });
      }
    }

    // 3. Regular Message Insertion
    await db.collection(body.server || "general").insertOne({ 
      text: body.text, 
      user: body.user, 
      isAdmin: body.isAdmin, 
      pfp: body.pfp, 
      image: body.image, 
      date: new Date() 
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Keep your GET and DELETE functions the same as previous versions
