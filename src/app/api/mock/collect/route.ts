import { NextResponse } from "next/server";
import { runMockCollection } from "@/lib/mock-collect";
import { CollectRequest } from "@/types/legacy-loop";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CollectRequest;

    if (!payload?.sources || !Array.isArray(payload.sources) || payload.sources.length === 0) {
      return NextResponse.json(
        { error: "At least one source must be selected." },
        { status: 400 },
      );
    }

    if (!payload.sourceDetails || typeof payload.sourceDetails !== "object") {
      return NextResponse.json(
        { error: "sourceDetails payload is required." },
        { status: 400 },
      );
    }

    const result = await runMockCollection(payload);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to complete mocked collection." },
      { status: 500 },
    );
  }
}
