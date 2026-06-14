import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
  console.error("REGISTER ERROR:", error);

  if (error.code === "P2002") {
    return NextResponse.json(
      { error: "Email already exists" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: "Something went wrong",
      details: error?.message || "Unknown error",
    },
    { status: 500 }
  );
}
}