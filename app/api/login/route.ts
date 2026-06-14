import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.email || !body.password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });
  if (!user) {
  return NextResponse.json(
    {
      error: "Invalid email or password",
    },
    {
      status: 401,
    }
  );
}

  const isPasswordCorrect = await bcrypt.compare(
    body.password,
    user!.password
  );

if (isPasswordCorrect) {
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  return NextResponse.json({
    message: "Login successful",
    token,
  });
}

return NextResponse.json(
  {
    error: "Invalid email or password",
  },
  {
    status: 401,
  }
);
}