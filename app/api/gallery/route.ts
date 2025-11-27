import { NextRequest, NextResponse } from "next/server";
import { getDonePhotos, deletePhotos, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    // No need to call initDatabase() - Prisma Client handles connections automatically
    const photos = await getDonePhotos();
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching gallery:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // No need to call initDatabase() - Prisma Client handles connections automatically
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    await deletePhotos(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photos:", error);
    return NextResponse.json(
      { error: "Failed to delete photos" },
      { status: 500 }
    );
  }
}

