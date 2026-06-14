import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      {
        error: "No token provided",
      },
      {
        status: 401,
      }
    );
  }

  const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET!
);

return NextResponse.json({
  decoded,
});
}