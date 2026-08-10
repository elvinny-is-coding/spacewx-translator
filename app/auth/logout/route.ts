import { signOut } from "@/app/auth/actions";
import { NextResponse } from "next/server";

export async function POST() {
  const result = await signOut();
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
