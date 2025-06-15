import { NextRequest, NextResponse } from "next/server";
import { checkShareExpiration, ensureShareAvailability } from "@/app/lib/mpc-key-manager";
import prisma from "@/prisma";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get('authorization');
    if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting automatic share rotation check...");

    const wallets = await prisma.solWallet.findMany({
      where: {
        shareThreshold: 3,
        totalShares: 3,
      },
      select: {
        userId: true,
        encryptedKeyShare: true,
        publicKey: true,
      },
    });

    console.log(`Found ${wallets.length} MPC wallets to check`);

    const results = {
      checked: 0,
      rotated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const wallet of wallets) {
      try {
        results.checked++;
        const status = await checkShareExpiration(wallet.userId);
        
        if (status.needsRotation) {
          console.log(`Rotating shares for user ${wallet.userId}:`, status);
          
          const success = await ensureShareAvailability(
            wallet.userId,
            wallet.encryptedKeyShare
          );

          if (success) {
            results.rotated++;
            console.log(`Successfully rotated shares for user ${wallet.userId}`);
          } else {
            results.failed++;
            results.errors.push(`Failed to rotate shares for user ${wallet.userId}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        const errorMsg = `Error processing wallet ${wallet.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    console.log("Share rotation check completed:", results);

    return NextResponse.json({
      success: true,
      message: "Share rotation check completed",
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Share rotation cron job failed:", error);
    return NextResponse.json(
      {
        error: "Share rotation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Share rotation cron endpoint is active",
    timestamp: new Date().toISOString(),
  });
} 