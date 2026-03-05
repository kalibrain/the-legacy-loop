import { NextResponse } from "next/server";
import {
  answerInterviewMessage,
  InterviewEngineError,
} from "@/lib/interview-engine";
import { InterviewChatRequest } from "@/types/legacy-loop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as InterviewChatRequest;
    if (!payload?.sessionId || !payload?.message) {
      return NextResponse.json(
        { error: "sessionId and message are required." },
        { status: 400 },
      );
    }

    const result = answerInterviewMessage(payload);
    await delay(3000);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (error instanceof InterviewEngineError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Failed to process interview answer." },
      { status: 500 },
    );
  }
}
