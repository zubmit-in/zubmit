import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    // Extract fields
    const workerFullName = formData.get("worker_full_name") as string;
    const workerContact = formData.get("worker_contact") as string;
    const workerUniversity = formData.get("worker_university") as string;
    const workerRollNo = formData.get("worker_roll_no") as string;
    const workerDegree = formData.get("worker_degree") as string;
    const workerSpecialization = formData.get("worker_specialization") as string;
    const accommodationType = formData.get("accommodation_type") as string;
    const towerNo = formData.get("tower_no") as string | null;
    const towerRoomNo = formData.get("tower_room_no") as string | null;
    const blockNo = formData.get("block_no") as string | null;
    const blockRoomNo = formData.get("block_room_no") as string | null;
    const upiQrFile = formData.get("upi_qr") as File | null;

    // Validate required fields
    if (
      !workerFullName ||
      !workerContact ||
      !workerUniversity ||
      !workerRollNo ||
      !workerDegree ||
      !workerSpecialization ||
      !accommodationType
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (accommodationType === "tower" && (!towerNo || !towerRoomNo)) {
      return NextResponse.json(
        { error: "Tower number and room number are required" },
        { status: 400 }
      );
    }

    if (accommodationType === "block" && (!blockNo || !blockRoomNo)) {
      return NextResponse.json(
        { error: "Block number and room number are required" },
        { status: 400 }
      );
    }

    if (!upiQrFile) {
      return NextResponse.json(
        { error: "UPI QR code screenshot is required" },
        { status: 400 }
      );
    }

    // Upload UPI QR image to Supabase Storage
    const fileExt = upiQrFile.name.split(".").pop() || "png";
    const filePath = `${userId}/upi-qr-${Date.now()}.${fileExt}`;
    const fileBuffer = Buffer.from(await upiQrFile.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("worker-upi-qr")
      .upload(filePath, fileBuffer, {
        contentType: upiQrFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("UPI QR upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload UPI QR code" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("worker-upi-qr").getPublicUrl(filePath);

    // Update profiles table
    const updateData: Record<string, unknown> = {
      worker_full_name: workerFullName,
      worker_contact: workerContact,
      worker_university: workerUniversity,
      worker_roll_no: workerRollNo,
      worker_degree: workerDegree,
      worker_specialization: workerSpecialization,
      accommodation_type: accommodationType,
      upi_qr_url: publicUrl,
      worker_profile_complete: true,
      role: "worker",
    };

    if (accommodationType === "tower") {
      updateData.tower_no = parseInt(towerNo!, 10);
      updateData.tower_room_no = towerRoomNo;
      updateData.block_no = null;
      updateData.block_room_no = null;
    } else {
      updateData.block_no = blockNo;
      updateData.block_room_no = blockRoomNo;
      updateData.tower_no = null;
      updateData.tower_room_no = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to save profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Setup profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
