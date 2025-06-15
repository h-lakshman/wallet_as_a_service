# Wallet-as-a-Service (WaaS) Platform

A secure, enterprise-grade wallet-as-a-service platform built with Next.js, implementing Multi-Party Computation (MPC) for private key management and seamless cryptocurrency wallet functionality.

## Architecture Overview

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Next.js)     │◄──►│   (Next.js API) │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Auth     │    │   MPC Manager   │    │   Redis Cluster │
│  (NextAuth.js)  │    │ (Key Splitting) │    │ (Share Storage) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Solana RPC    │    │   Token Swap    │    │ Auto-Rotation   │
│  (Blockchain)   │    │   (Jupiter API) │    │ (7-day warn)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Multi-Party Computation (MPC) Architecture

3-of-3 threshold MPC scheme using Shamir's Secret Sharing with automatic rotation and recovery:

```
Private Key → Split into 3 Shares → Distributed Storage → Auto-Rotation
     │
     ├── Share 1: PostgreSQL Database (Encrypted, Permanent)
     ├── Share 2: Redis Instance 1 (Encrypted, 30-day TTL)
     └── Share 3: Redis Instance 2 (Encrypted, 30-day TTL)

Auto-Rotation: Triggered 7 days before expiration
Recovery: Automatic rebuild from database share when Redis fails
```

## Key Features

- **Dynamic Priority Fees**: Network congestion-based fee calculation
- **Intelligent Retry**: Exponential backoff with fee increases
- **Jupiter Integration**: Optimal swap routes with 0.5% slippage
- **MPC Signing**: Secure transaction signing with automatic share management
- **No Single Point of Failure**: All 3 shares required for key reconstruction
- **Encrypted Storage**: AES-256 encryption for all shares
- **Memory Safety**: Private keys cleared immediately after use

## User Flow

### Authentication & Wallet Creation

1. User signs in via Google OAuth (NextAuth.js)
2. System generates MPC wallet automatically for new users
3. Private key split into 3 encrypted shares and distributed
4. User receives wallet public key and can start transacting

### Transaction Process

1. User initiates token swap
2. System checks share availability and auto-rotates if needed
3. Jupiter API calculates optimal swap route
4. Dynamic priority fee calculated based on network congestion
5. Transaction signed using reconstructed private key (all 3 shares)
6. Private key immediately cleared from memory
7. Transaction submitted with retry logic

## API Endpoints

### Core Operations

- `POST /api/auth/signin` - User authentication
- `GET /api/wallet/balance` - Retrieve wallet balance
- `POST /api/swap` - Execute token swap transaction
- `GET /api/mpc/health` - MPC system health check
- `POST /api/mpc/rotate` - Automatic share rotation (cron job)

## Environment Configuration

```bash
# Database
DATABASE_URL="postgresql://..."

# MPC Configuration
MPC_ENCRYPTION_KEY="your-256-bit-encryption-key"
REDIS_URL_1="redis://redis1.example.com:6379"
REDIS_URL_2="redis://redis2.example.com:6379"

# Solana Network
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Authentication
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"

# Automation
CRON_SECRET="your-cron-secret-for-automated-tasks"
```

## Priority Fee Management

Dynamic fee calculation optimizes transaction success rates:

```typescript
// Network congestion-based fee calculation
const priorityFee = await calculatePriorityFee({
  recentSlots: 20,
  percentile: 75,
  maxFee: 0.01 * LAMPORTS_PER_SOL,
});

// Adaptive retry with fee increases
// 1st retry: +25% fee, 2nd retry: +50% fee
```

## Deployment

### Production Setup

1. **Database**: PostgreSQL with read replicas and automated backups
2. **Redis Cluster**: Two separate instances with cross-region deployment
3. **Application**: Next.js with horizontal scaling and load balancing
4. **Automation**: Daily cron jobs for share rotation and health monitoring

### Monitoring

- MPC share availability across storage systems
- Transaction success rates and fee efficiency
- Share rotation success/failure tracking
- Automated alerts for system anomalies

## Development Setup

```bash
# Prerequisites: Node.js 18+, PostgreSQL 14+, Redis 6+

# Installation
npm install
npx prisma migrate dev
npx prisma generate

# Environment Setup
cp .env.example .env.local
# Configure environment variables

# Development Server
npm run dev

# Test Share Rotation
npm run migrate-backup all
```
