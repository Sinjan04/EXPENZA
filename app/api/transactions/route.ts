import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET!
  );

const userData = decoded as {
  userId: string;
  email: string;
};
const body = await req.json();
if (body.amount <= 0) {
  return NextResponse.json(
    { error: "Amount must be greater than 0" },
    { status: 400 }
  );
}

if (
  body.type !== "income" &&
  body.type !== "expense"
) {
  return NextResponse.json(
    { error: "Invalid transaction type" },
    { status: 400 }
  );
}

if (!body.category) {
  return NextResponse.json(
    { error: "Category is required" },
    { status: 400 }
  );
}

const transaction = await prisma.transaction.create({
  data: {
    amount: body.amount,
    type: body.type,
    category: body.category,
    note: body.note,
    userId: userData.userId,
  },
});

return NextResponse.json(transaction);
}
export async function GET(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
  }

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

  return NextResponse.json(transactions);
}
export async function DELETE(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET!
  );

  const userData = decoded as {
    userId: string;
    email: string;
  };

  const { searchParams } = new URL(req.url);

  const transactionId =
    searchParams.get("id");

  if (!transactionId) {
    return NextResponse.json(
      { error: "Transaction ID required" },
      { status: 400 }
    );
  }

  const transaction =
    await prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });

  if (!transaction) {
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 }
    );
  }

  if (
    transaction.userId !== userData.userId
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    );
  }

  await prisma.transaction.delete({
    where: {
      id: transactionId,
    },
  });

  return NextResponse.json({
    message: "Transaction deleted",
  });
}