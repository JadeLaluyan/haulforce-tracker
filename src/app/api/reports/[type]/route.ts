import { NextRequest } from "next/server";
import { resolvePeriod } from "@/lib/period";
import { buildReport, reportToCsv } from "@/lib/server/reports";
import { handleError } from "@/lib/server/query";

type Params = { params: Promise<{ type: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { type } = await params;
    const sp = req.nextUrl.searchParams;
    const range = resolvePeriod(sp.get("period"), sp.get("from"), sp.get("to"));
    const report = await buildReport(type, range);

    if (sp.get("format") === "csv") {
      const csv = reportToCsv(report);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}-${range.from.toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return Response.json({ data: report });
  } catch (e) {
    return handleError(e);
  }
}
