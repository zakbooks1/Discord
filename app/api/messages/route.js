import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";

const client = new MongoClient(process.env.MONGODB_URI);
const ADMIN_WHITELIST = ["u_3uqqpsixd"]; // Put your ID here after logging in!

export async function POST(req) {
  try {
    const body = await req.json();
    await client.connect();
    const db = client.db("chatdb");

    // --- LOGIN / REGISTER LOGIC ---
    if (body.action === "auth") {
      const existingUser = await db.collection("users").findOne({ name: body.user });
      
      if (existingUser) {
        // Login: Check password
        if (existingUser.password === body.password) {
          return NextResponse.json({ success: true, user: existingUser });
        } else {
          return NextResponse.json({ error: "Wrong password" }, { status: 401 });
        }
      } else {
        // Register: Create new user
        const newUser = {
          name: body.user,
          password: body.password,
          uid: "u_" + Math.random().toString(36).slice(2, 11),
          pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${body.user}`,
          date: new Date()
        };
        await db.collection("users").insertOne(newUser);
        return NextResponse.json({ success: true, user: newUser });
      }
    }

    // --- PFP UPDATE LOGIC ---
    if (body.action === "update_pfp") {
      await db.collection("users").updateOne(
        { uid: body.uid },
        { $set: { pfp: body.pfp } }
      );
      return NextResponse.json({ success: true });
    }

    // --- MESSAGE LOGIC ---
    const isBanned = await db.collection("blacklist").findOne({ uid: body.uid });
    if (isBanned) return NextResponse.json({ error: "Banned" }, { status: 403 });

    const isAuthAdmin = ADMIN_WHITELIST.includes(body.uid);
    
    // Process Admin Commands (Announce, Clear, etc)
    if (body.adminAction && isAuthAdmin) {
        if (body.action === "announce") {
            await db.collection(body.server).insertOne({
              text: body.text, user: "SYSTEM", pfp: "https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png",
              uid: "system", isAnnounce: true, date: new Date()
            });
            return NextResponse.json({ success: true });
        }
        if (body.action === "clear") {
            await db.collection(body.server).deleteMany({});
            return NextResponse.json({ success: true });
        }
    }

    await db.collection(body.server || "general").insertOne({
      text: body.text, user: body.user, pfp: body.pfp, 
      image: body.image, uid: body.uid, date: new Date(),
      isAdmin: isAuthAdmin
    });

    return NextResponse.json({ success: true });
  } catch (e) { return NextResponse.json({ error: "Server Error" }, { status: 500 }); }
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const server = searchParams.get("server") || "general";
    const type = searchParams.get("type");
    
    try {
        await client.connect();
        const db = client.db("chatdb");
        
        if (type === "servers") {
            const cols = await db.listCollections().toArray();
            return NextResponse.json(cols.map(c => c.name).filter(n => !["users", "blacklist"].includes(n)));
        }

        const msgs = await db.collection(server).find().sort({ date: -1 }).limit(50).toArray();
        return NextResponse.json(msgs.map(m => ({ ...m, isAdmin: ADMIN_WHITELIST.includes(m.uid) })));
    } catch (e) { return NextResponse.json([]); }
}
