import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { collegeName, degree, specialization, semester, rollNo, phone } = body;

    if (!collegeName || !degree || !semester) {
      return NextResponse.json(
        { error: "College name, degree, and semester are required" },
        { status: 400 }
      );
    }

    // Upsert profile in Supabase
    const { error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          email: user.emailAddresses[0]?.emailAddress || "",
          phone: phone || null,
          college_name: collegeName,
          degree,
          specialization: specialization || null,
          semester: parseInt(semester.toString()),
          roll_no: rollNo || null,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
