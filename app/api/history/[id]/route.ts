// ============================================================
// API ROUTE - DELETE /api/history/:id
// ============================================================
// Removes a single history entry.
// ============================================================

import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  // Route handler params are a Promise in Next.js 15+ / 16.
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);

  if (Number.isNaN(numericId)) {
    return NextResponse.json({ error: "Invalid history id" }, { status: 400 });
  }

  try {
    const result = await query("DELETE FROM request_history WHERE id = $1", [
      numericId,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "History entry not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: result.rowCount });
  } catch (error) {
    console.error("[api/history/:id] DELETE failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete entry" },
      { status: 500 }
    );
  }
}