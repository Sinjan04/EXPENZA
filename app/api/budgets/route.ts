import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

  const budgets = await prisma.budget.findMany({
    where: {
      userId: userId,
    },
  });

  return NextResponse.json(budgets);
}

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
      userId: userId,
    },
  });

  return NextResponse.json(budget);
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