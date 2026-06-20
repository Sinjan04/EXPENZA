import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  let userId: string | null = null;

  // Hybrid Auth Check
  if (session?.user) {
    userId = (session.user as any).userId;
  } else {
    const token = req.headers.get("authorization");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (e) {
        // Invalid token
      }
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
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
    userId: userId,
  },
});

return NextResponse.json(transaction);
}
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  let userId: string | null = null;

  // Hybrid Auth Check
  if (session?.user) {
    userId = (session.user as any).userId;
  } else {
    const token = req.headers.get("authorization");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (e) {
        // Invalid token
      }
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
    },
  });

  return NextResponse.json(transactions);
}
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  let userId: string | null = null;

  // Hybrid Auth Check
  if (session?.user) {
    userId = (session.user as any).userId;
  } else {
    const token = req.headers.get("authorization");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (e) {
        // Invalid token
      }
    }
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

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
    transaction.userId !== userId
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
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  let userId: string | null = null;

  // Hybrid Auth Check
  if (session?.user) {
    userId = (session.user as any).userId;
  } else {
    const token = req.headers.get("authorization");
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (e) {
        // Invalid token
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("id");

  if (!transactionId) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  const body = await req.json();

  if (body.amount <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
  }

  const existingTx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!existingTx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (existingTx.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updatedTransaction = await prisma.transaction.update({
    where: {
      id: transactionId,
    },
    data: {
      amount: body.amount,
      note: body.note,
      createdAt: body.createdAt ? new Date(body.createdAt) : undefined,
    },
  });

  return NextResponse.json(updatedTransaction);
}