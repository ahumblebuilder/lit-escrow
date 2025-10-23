# Vincent ERC20 Transfer Scheduler

A minimal implementation of a Vincent-powered ERC20 transfer scheduler that allows users to schedule automated token transfers on Sepolia testnet.

## Overview

This application demonstrates how to use Vincent abilities to schedule and execute recurring ERC20 token transfers on behalf of users. It's a simplified version of the original DCA (Dollar-Cost Averaging) application, focused on basic token transfers.

## Features

- **Simple Transfer Scheduling**: Users can create jobs that transfer a specified amount of tokens every minute
- **Vincent Integration**: Uses Vincent abilities for secure, delegated token transfers
- **Sepolia Testnet**: Configured to work with Sepolia testnet and a specific ERC20 token
- **Minimal UI**: Clean, simple interface for creating transfer jobs

## Architecture

### Backend (`packages/dca-backend`)

- **Express API**: RESTful endpoints for creating and managing transfer jobs
- **Agenda Scheduler**: Job scheduling system that runs transfer jobs every minute
- **MongoDB**: Stores transfer job records and transaction history
- **Vincent Abilities**: Uses `@lit-protocol/vincent-ability-erc20-transfer` for token transfers

### Frontend (`packages/dca-frontend`)

- **React App**: Simple presentation page with form to create transfer jobs
- **Vincent Auth**: Integration with Vincent for user authentication and delegation

## Token Configuration

The application is configured to work with a specific ERC20 token on Sepolia:

- **Token Address**: `0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089`
- **Network**: Sepolia Testnet (Chain ID: 11155111)

## Setup

### Prerequisites

- Node ^22.16.0
- pnpm ^10.7.0
- Docker or local MongoDB instance
- A Vincent App with ERC20 transfer abilities

### Environment Variables

Create `.env` files in the root and backend package with the following variables:

```env
# Backend (.env)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
MONGODB_URI=mongodb://localhost:27017/transfer-scheduler
VINCENT_APP_ID=your_vincent_app_id
VINCENT_DELEGATEE_PRIVATE_KEY=your_delegatee_private_key
ALLOWED_AUDIENCE=https://your-frontend-domain.com
CORS_ALLOWED_DOMAIN=https://your-frontend-domain.com
PORT=3001
IS_DEVELOPMENT=true
```

```env
# Frontend (.env)
VITE_APP_ID=your_vincent_app_id
VITE_BACKEND_URL=http://localhost:3001
VITE_REDIRECT_URI=http://localhost:3000
```

### Installation

```bash
# Install dependencies
pnpm install

# Build packages
pnpm build

# Start MongoDB (if using Docker)
pnpm -r mongo:build
pnpm -r mongo:up

# Start development servers
pnpm dev
```

## Usage

1. **Connect with Vincent**: Users must first connect their wallet with Vincent and delegate to your app
2. **Create Transfer Job**: Fill in the recipient address and amount to transfer
3. **Automatic Execution**: The job will run every minute, transferring the specified amount

## API Endpoints

- `POST /transfer-job` - Create a new transfer job
- `DELETE /transfer-job/:jobId` - Cancel a transfer job

## Vincent App Setup

To use this application, you need to create a Vincent App with ERC20 transfer abilities:

1. Go to the Vincent Dashboard
2. Create a new app
3. Add the ERC20 Transfer ability
4. Configure the app for Sepolia testnet
5. Update the `VINCENT_APP_ID` in your environment variables

## Development

The application uses a monorepo structure with separate packages for frontend and backend. The backend runs both the API server and job worker, while the frontend provides a simple interface for users.

## Notes

- This is a minimal implementation for demonstration purposes
- Users must have sufficient token balance for transfers to succeed
- Jobs run every minute by default (configurable in the code)
- All transfers are recorded in the database with transaction hashes

## License

This project is provided for educational and demonstration purposes.
