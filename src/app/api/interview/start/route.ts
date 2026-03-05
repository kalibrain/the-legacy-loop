import { NextResponse } from "next/server";
import { startInterviewSession } from "@/lib/interview-engine";
import { InterviewStartRequest } from "@/types/legacy-loop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InterviewStartRequest;
    if (!payload?.resourceContext) {
      return NextResponse.json(
        { error: "resourceContext is required." },
        { status: 400 },
      );
    }

    const result = startInterviewSession(payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (error instanceof Error && "status" in error) {
      const status = (error as { status?: number }).status ?? 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Unable to start interview session." },
      { status: 500 },
    );
  }
}
