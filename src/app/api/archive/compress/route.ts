import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { getArchiveDir } from "@/lib/archive-utils";
import { compressArchiveFiles, type CompressionStreamMessage } from "@/lib/archive-compression";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const year = body?.year;
  if (!year) {
    return NextResponse.json({ error: "Missing year parameter" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: CompressionStreamMessage) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        await compressArchiveFiles(getArchiveDir(year), req.signal, send);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Server Error";
        send({ type: "done", success: false, message });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
