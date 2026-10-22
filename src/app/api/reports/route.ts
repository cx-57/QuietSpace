import { handleReport } from "../../../lib/report-handler";
import { reportConfig, submitReport } from "../../../lib/server/reports";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleReport(request, { config: reportConfig(), now: () => new Date(), submit: submitReport });
}
