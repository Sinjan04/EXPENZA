import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
const authHeader = req.headers.get("authorization");

if (!authHeader) {
  return NextResponse.json(
    { error: "No token provided" },
    { status: 401 }
  );
}

const token = authHeader.replace("Bearer ", "");

const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET!
);

  const userData = decoded as {
    userId: string;
    email: string;
  };

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userData.userId,
    },
  });

  const totalIncome = transactions
  .filter((t) => t.type === "income")
  .reduce((sum, t) => sum + t.amount, 0);

const totalExpense = transactions
  .filter((t) => t.type === "expense")
  .reduce((sum, t) => sum + t.amount, 0);

const balance = totalIncome - totalExpense;

return NextResponse.json({
  totalIncome,
  totalExpense,
  balance,
});
}