import { NextResponse } from "next/server";
import { CSV_TEMPLATE } from "@/lib/csv";

export async function GET() {
  return new NextResponse(CSV_TEMPLATE, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=fern-stock-template.csv",
    },
  });
}
