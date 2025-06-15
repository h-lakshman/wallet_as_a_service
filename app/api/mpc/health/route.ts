import { NextResponse } from "next/server";
import { healthCheck } from "@/app/lib/mpc-key-manager";

export async function GET() {
  try {
    const healthStatus = await healthCheck();

    const isHealthy =
      healthStatus.redisConnected &&
      healthStatus.encryptionWorking &&
      healthStatus.shareReconstructionWorking;

    return NextResponse.json(
      {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        components: {
          redis: healthStatus.redisConnected ? "up" : "down",
          encryption: healthStatus.encryptionWorking ? "working" : "failed",
          shareReconstruction: healthStatus.shareReconstructionWorking
            ? "working"
            : "failed",
        },
        details: healthStatus,
      },
      {
        status: isHealthy ? 200 : 503,
      }
    );
  } catch (error) {
    console.error("MPC health check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Failed to perform health check",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      }
    );
  }
}
