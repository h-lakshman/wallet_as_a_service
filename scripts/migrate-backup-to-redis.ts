import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

const prisma = new PrismaClient();

// Redis 2 for backup shares
const redis2 = new Redis(process.env.REDIS_URL_2 || "redis://localhost:6379");

/**
 * Migrates a specific user's backup share from database to Redis 2
 */
async function migrateUserBackupToRedis(
  userId: string,
  backupShare: string,
  publicKey: string
) {
  console.log(`🔄 Migrating backup share for user ${userId}...`);
  console.log(`📍 Public key: ${publicKey}`);

  try {
    // 1. Store backup share in Redis 2
    const redisKey3 = `mpc:share:${userId}:3`;
    await redis2.setex(redisKey3, 86400 * 30, backupShare); // 30 days
    console.log(`✅ Stored backup share in Redis 2: ${redisKey3}`);

    // 2. Verify the share was stored correctly
    const storedShare = await redis2.get(redisKey3);
    if (storedShare === backupShare) {
      console.log(`✅ Verification passed - share stored correctly`);
    } else {
      throw new Error("Verification failed - stored share doesn't match");
    }

    // 3. Remove backup share from database
    await prisma.solWallet.update({
      where: { userId },
      data: {
        backupKeyShare: null, // Remove from database
      },
    });
    console.log(`✅ Removed backup share from database`);

    console.log(`🎉 Successfully migrated user ${userId} to dual Redis setup`);
  } catch (error) {
    console.error(`❌ Migration failed for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Migrates all users with backup shares in database to Redis 2
 */
async function migrateAllBackupShares() {
  console.log("🔄 Starting migration of all backup shares to Redis 2...");

  try {
    // Find all wallets that still have backup shares in database
    const walletsWithBackup = await prisma.solWallet.findMany({
      where: {
        backupKeyShare: { not: null },
      },
      include: {
        user: true,
      },
    });

    if (walletsWithBackup.length === 0) {
      console.log(
        "✅ No backup shares found in database. All already migrated."
      );
      return;
    }

    console.log(
      `Found ${walletsWithBackup.length} wallets with backup shares in database`
    );

    for (const wallet of walletsWithBackup) {
      if (wallet.backupKeyShare) {
        await migrateUserBackupToRedis(
          wallet.userId,
          wallet.backupKeyShare,
          wallet.publicKey
        );

        // Add delay to avoid overwhelming systems
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log("🎉 All backup shares migrated successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await redis2.disconnect();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "single":
      const userId = "f2f4ea80-ccd2-4b5e-b782-afb56b6de964";
      const backupShare =
        "U2FsdGVkX1+89SEdXZQyZXGXKxtkfeG+HD+hWfDGMZllVpw9Tb8+k5pfsRKb92205BU/EijXVj+6IR1WY3maC1fg7WlC9E5qmE8bDIVzZ5Lkt46r8k4uvmMAwt4+hsshFSK35YfHo8gKp6xxPvsOxF/ZqLOWECmfvjQ7qu/rUTcvLRdceiXY74CBqHsPYm0VlFBhoGJP5QseBXDOUyvz3iE8BGaUq+VSAipPaaluB1EIaWBCGMydK84KTscqjfLOBkrQXQO48Fv3VpyEJmi8nd2TbdeNY22fWTfR0hudJUk9C7Yitt9UcCxCR7sutge7dPPli98J5xdqW8GWbc8H/8OSUcgbdhjedzAsJx3IlDwRoOYwP/y+Ns9Yxvx1Ax52ZPMjRHVtz1/GGrT59zqiNHfc5XZkcRqsSD+VYoBx+Lg=";
      const publicKey = "J3fgaxqCYESC9GUbGuFxj6ULqec4tbLaB4EAAeSsdWLA";

      migrateUserBackupToRedis(userId, backupShare, publicKey)
        .then(() => console.log("✅ Single user migration completed"))
        .catch(console.error);
      break;

    case "all":
      migrateAllBackupShares()
        .then(() => console.log("✅ All users migration completed"))
        .catch(console.error);
      break;

    default:
      console.log("Usage:");
      console.log("  npm run migrate-backup single   # Migrate specific user");
      console.log("  npm run migrate-backup all      # Migrate all users");
      break;
  }
}
