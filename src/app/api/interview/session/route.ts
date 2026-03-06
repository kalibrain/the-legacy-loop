import { NextResponse } from "next/server";
import {
  getInterviewSessionSnapshot,
  InterviewEngineError,
} from "@/lib/interview-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required." },
        { status: 400 },
      );
    }

    const result = await getInterviewSessionSnapshot(sessionId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InterviewEngineError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Failed to fetch interview session.";
    console.error("[interview/session]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
