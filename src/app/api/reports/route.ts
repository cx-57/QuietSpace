import { handleReport } from "../../../lib/report-handler";
import { reportConfig, submitReport } from "../../../lib/server/reports";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const config = reportConfig();
  const networkAddress = config?.trustedIpHeader === "x-quietspace-local-bucket" && process.env.NODE_ENV === "development" && process.env.QUIETSPACE_DATA_MODE === "postgres" ? "127.0.0.1" : undefined;
  return handleReport(request, { config, networkAddress, now: () => new Date(), submit: submitReport });
}
