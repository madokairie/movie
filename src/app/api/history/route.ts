import { NextRequest, NextResponse } from "next/server";
import { getHistory, getResultById } from "@/lib/storage";

// ---------------------------------------------------------------------------
// GET /api/history
// GET /api/history?id=xxx
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (id) {
    const entry = await getResultById(id);
    if (!entry) {
      return NextResponse.json(
        { error: "Not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(entry);
  }

  const history = await getHistory();
  return NextResponse.json(history);
}
