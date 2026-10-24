export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.QUIETSPACE_DATA_MODE === "postgres" && process.env.REPORTS_ENABLED === "true") {
    const { startAbuseCleanup } = await import("./lib/server/cleanup");
    await startAbuseCleanup();
  }
}
