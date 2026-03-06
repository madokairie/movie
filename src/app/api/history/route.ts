import { NextRequest, NextResponse } from "next/server";
import { getHistory, getResultById, updateTitle, deleteEntry } from "@/lib/storage";

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

// ---------------------------------------------------------------------------
// PATCH /api/history  { id, title }
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  let body: { id?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, title } = body;
  if (!id || !title) {
    return NextResponse.json({ error: "id and title are required" }, { status: 400 });
  }

  const updated = await updateTitle(id, title);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// DELETE /api/history?id=xxx
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const deleted = await deleteEntry(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
