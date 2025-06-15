-- Remove backupKeyShare column from solWallet table
-- This column is no longer needed as Share 3 is now stored in Redis 2

ALTER TABLE "solWallet" DROP COLUMN "backupKeyShare"; 