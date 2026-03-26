import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, name, email, password } = body as {
      companyName: string;
      name: string;
      email: string;
      password: string;
    };

    if (!companyName?.trim() || !name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Create Account + User atomically
    const account = await prisma.account.create({
      data: {
        name: companyName.trim(),
        subscriptionStatus: "trialing",
        trialEndsAt,
        users: {
          create: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash: await bcrypt.hash(password, 10),
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json({ accountId: account.id }, { status: 201 });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
