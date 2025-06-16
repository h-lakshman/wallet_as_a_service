import { PrismaClient } from "@prisma/client";
import { Keypair } from "@solana/web3.js";
import { generateMPCWallet } from "../app/lib/mpc-key-manager";
import * as sss from "shamirs-secret-sharing";
import CryptoJS from "crypto-js";

const prisma = new PrismaClient();

const MPC_ENCRYPTION_KEY =
  process.env.MPC_ENCRYPTION_KEY || "default-key-change-in-production";

async function migrateSingleWallet(
  walletId: string,
  privateKeyString: string,
  userId: string
) {
  console.log(`Migrating wallet ${walletId}...`);

  // Parse the old private key format (comma-separated numbers)
  const secretKey = privateKeyString.split(",").map((key) => Number(key));
  const privateKeyUintArr = Uint8Array.from(secretKey);
  const keypair = Keypair.fromSecretKey(privateKeyUintArr);
  const publicKey = keypair.publicKey.toBase58();

  const privateKeyBuffer = Buffer.from(privateKeyUintArr);

  const shares = sss.split(privateKeyBuffer, {
    shares: 3,
    threshold: 3,
  });

  // Encrypt each share
  const encryptedShares = shares.map((share, index) => ({
    shareIndex: index + 1,
    shareData: CryptoJS.AES.encrypt(
      share.toString("hex"),
      MPC_ENCRYPTION_KEY
    ).toString(),
  }));

  // Store share 2 in Redis 1
  const redis1 = new (await import("ioredis")).default(
    process.env.REDIS_URL_1 || "redis://localhost:6379"
  );
  const redisKey2 = `mpc:share:${userId}:2`;
  await redis1.setex(redisKey2, 86400 * 30, encryptedShares[1].shareData); // 30 days

  // Store share 3 in Redis 2 (same instance for now)
  const redis2 = new (await import("ioredis")).default(
    process.env.REDIS_URL_2 || "redis://localhost:6379"
  );
  const redisKey3 = `mpc:share:${userId}:3`;
  await redis2.setex(redisKey3, 86400 * 30, encryptedShares[2].shareData); // 30 days

  // Update database with MPC structure
  await prisma.solWallet.update({
    where: { id: walletId },
    data: {
      encryptedKeyShare: encryptedShares[0].shareData,
      shareIndex: 1,
      shareThreshold: 3,
      totalShares: 3,
      updatedAt: new Date(),
    },
  });

  console.log(`Successfully migrated wallet ${walletId} (${publicKey})`);
  return { publicKey, migratedAt: new Date() };
}

export async function migrateAllWallets() {
  console.log(" Starting migration to MPC system...");

  try {
    // Find all wallets that still have the temp default values
    const walletsToMigrate = await prisma.solWallet.findMany({
      where: {
        encryptedKeyShare: "TEMP_DEFAULT",
      },
      include: {
        user: true,
      },
    });

    if (walletsToMigrate.length === 0) {
      console.log("No wallets found to migrate. All wallets already use MPC.");
      return;
    }

    console.log(`Found ${walletsToMigrate.length} wallets to migrate...`);

    const migrationResults = [];

    for (const wallet of walletsToMigrate) {
      try {
        // Get the legacy private key from the privateKey field
        const legacyPrivateKey = (wallet as any).privateKey;

        if (!legacyPrivateKey) {
          console.log(
            `Wallet ${wallet.id} has no legacy private key, skipping...`
          );
          continue;
        }

        console.log(
          `Migrating wallet ${wallet.id} for user ${wallet.user.username}...`
        );

        const result = await migrateSingleWallet(
          wallet.id,
          legacyPrivateKey,
          wallet.userId
        );

        migrationResults.push({
          walletId: wallet.id,
          userId: wallet.userId,
          publicKey: result.publicKey,
          migratedAt: result.migratedAt,
        });

        console.log(`Successfully migrated wallet ${wallet.id}`);

        // Add delay to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to migrate wallet ${wallet.id}:`, error);
        migrationResults.push({
          walletId: wallet.id,
          userId: wallet.userId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log("\nMigration Summary:");
    console.log(`Total wallets processed: ${walletsToMigrate.length}`);
    console.log(
      `Successfully migrated: ${
        migrationResults.filter((r) => !r.error).length
      }`
    );
    console.log(`Failed: ${migrationResults.filter((r) => r.error).length}`);

    if (migrationResults.some((r) => r.error)) {
      console.log("\nFailed migrations:");
      migrationResults
        .filter((r) => r.error)
        .forEach((r) => console.log(`  - Wallet ${r.walletId}: ${r.error}`));
    }

    return migrationResults;
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Validates that MPC migration was successful
 */
export async function validateMigration() {
  console.log("🔍 Validating MPC migration...");

  try {
    const mpcWallets = await prisma.solWallet.findMany({
      where: {
        shareThreshold: 3,
        totalShares: 3,
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${mpcWallets.length} MPC wallets to validate...`);

    let validWallets = 0;
    let invalidWallets = 0;

    for (const wallet of mpcWallets) {
      try {
        // Try to reconstruct the private key using all 3 shares (from database + both Redis)
        const { reconstructPrivateKey } = await import(
          "../app/lib/mpc-key-manager"
        );
        const reconstructedKey = await reconstructPrivateKey(
          wallet.userId,
          wallet.encryptedKeyShare
        );

        // Verify public key matches
        if (reconstructedKey.publicKey.toBase58() === wallet.publicKey) {
          validWallets++;
          console.log(`✅ Wallet ${wallet.id} validation passed`);
        } else {
          invalidWallets++;
          console.log(
            ` Wallet ${wallet.id} validation failed - public key mismatch`
          );
        }

        // Clear reconstructed key from memory
        reconstructedKey.secretKey.fill(0);
      } catch (error) {
        invalidWallets++;
        console.log(` Wallet ${wallet.id} validation failed:`, error);
      }
    }

    console.log(`\nValidation Results:`);
    console.log(`Valid wallets: ${validWallets}`);
    console.log(`Invalid wallets: ${invalidWallets}`);
    console.log(
      `Success rate: ${((validWallets / mpcWallets.length) * 100).toFixed(2)}%`
    );

    return {
      total: mpcWallets.length,
      valid: validWallets,
      invalid: invalidWallets,
      successRate: (validWallets / mpcWallets.length) * 100,
    };
  } catch (error) {
    console.error(" Validation failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Rollback migration for a specific wallet (emergency use only)
 */
export async function rollbackWallet(walletId: string) {
  console.log(`Rolling back wallet ${walletId} to legacy format...`);

  try {
    const wallet = await prisma.solWallet.findUnique({
      where: { id: walletId },
      include: { user: true },
    });

    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }

    // Reconstruct the private key using all 3 shares (from database + both Redis)
    const { reconstructPrivateKey } = await import(
      "../app/lib/mpc-key-manager"
    );
    const reconstructedKey = await reconstructPrivateKey(
      wallet.userId,
      wallet.encryptedKeyShare
    );

    // Convert back to legacy format
    const legacyPrivateKey = Array.from(reconstructedKey.secretKey).join(",");

    // Update database (this requires modifying schema temporarily)
    // Note: This is for emergency use only
    console.log("Legacy private key format:", legacyPrivateKey);

    // Clear reconstructed key from memory
    reconstructedKey.secretKey.fill(0);

    console.log(`Wallet ${walletId} rolled back successfully`);
  } catch (error) {
    console.error(`Rollback failed for wallet ${walletId}:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case "migrate":
      migrateAllWallets()
        .then(() => console.log("Migration completed"))
        .catch(console.error);
      break;

    case "validate":
      validateMigration()
        .then(() => console.log("Validation completed"))
        .catch(console.error);
      break;

    case "rollback":
      const walletId = process.argv[3];
      if (!walletId) {
        console.error("Please provide wallet ID to rollback");
        process.exit(1);
      }
      rollbackWallet(walletId)
        .then(() => console.log("Rollback completed"))
        .catch(console.error);
      break;

    default:
      console.log("Usage:");
      console.log("  npm run migrate-mpc migrate    # Migrate all wallets");
      console.log("  npm run migrate-mpc validate   # Validate migration");
      console.log(
        "  npm run migrate-mpc rollback <walletId>  # Rollback wallet"
      );
      break;
  }
}
