import { NextResponse } from "next/server";
import { getAllPhotos, initDatabase } from "@/lib/db";

export async function GET() {
  try {
    await initDatabase();
    const photos = await getAllPhotos();
    return NextResponse.json(photos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

