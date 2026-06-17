import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { downloadDocument } from "@/actions/documents";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const result = await downloadDocument(id);

  if (!result.success || !result.data) {
    const status = result.error === "Document not found" ? 404 : 401;
    return NextResponse.json({ error: result.error }, { status });
  }

  const isPdf =
    result.data.fileType === "application/pdf" ||
    result.data.fileName.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return NextResponse.json(
      { error: "Preview is only available for PDF files" },
      { status: 415 }
    );
  }

  try {
    const buffer = await readFile(result.data.path);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(result.data.fileName)}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
