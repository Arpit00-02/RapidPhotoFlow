import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initDatabase } from "@/lib/db";

export async function GET() {
  try {
    // Test Prisma connection
    await prisma.$connect();
    console.log("Prisma connection successful");

    // Initialize database
    await initDatabase();

    // Test table exists by trying to count photos
    const photoCount = await prisma.photo.count();
    console.log("Photos table exists, count:", photoCount);

    return NextResponse.json({
      success: true,
      message: "Prisma connection successful",
      photoCount,
      envCheck: {
        hasPrismaUrl: !!process.env.PRISMA_DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
      },
    });
  } catch (error) {
    console.error("Database test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: errorStack,
        envCheck: {
          hasPrismaUrl: !!process.env.PRISMA_DATABASE_URL,
          hasPostgresUrl: !!process.env.POSTGRES_URL,
        },
      },
      { status: 500 }
    );
  }
}

