import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

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

  const budgets = await prisma.budget.findMany({
    where: {
      userId: userData.userId,
    },
  });

  return NextResponse.json(budgets);
}

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
  
  if (!body.limit || body.limit <= 0) {
    return NextResponse.json(
      { error: "Budget limit must be greater than 0" },
      { status: 400 }
    );
  }
  
  if (!body.category) {
    return NextResponse.json(
      { error: "Category is required" },
      { status: 400 }
    );
  }

  const budget = await prisma.budget.create({
    data: {
      category: body.category,
      limit: body.limit,
      userId: userData.userId,
    },
  });

  return NextResponse.json(budget);
}

export async function DELETE(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
  }

  const url = new URL(req.url);

  const budgetId =
    url.searchParams.get("id");

  if (!budgetId) {
    return NextResponse.json(
      { error: "Budget id required" },
      { status: 400 }
    );
  }

  await prisma.budget.delete({
    where: {
      id: budgetId,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
export async function PUT(req: Request) {
  const token = req.headers.get("authorization");

  if (!token) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
  }

  // Verify the token to ensure the user is authenticated
  jwt.verify(token, process.env.JWT_SECRET!);

  const body = await req.json();

 if (!body.id || !body.limit || body.limit <= 0) {
    return NextResponse.json(
      { error: "Budget ID and a limit greater than 0 are required" },
      { status: 400 }
    );
  }

  const updatedBudget = await prisma.budget.update({
    where: {
      id: body.id,
    },
    data: {
      limit: body.limit,
    },
  });

  return NextResponse.json(updatedBudget);
}