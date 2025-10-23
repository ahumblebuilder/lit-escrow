# Derifun Write Option Debugging Guide

## Common Issues and Solutions

### 1. **500 Internal Server Error**

The 500 error can be caused by several issues. Check the backend logs for specific error messages.

#### **Vault Address Issues**

- **Invalid vault address**: Ensure the vault address is a valid Ethereum address
- **Vault doesn't exist**: The vault contract might not exist on Sepolia
- **Vault not a Derifun vault**: The contract might not implement the IOptionVault interface

#### **RPC Connection Issues**

- **Sepolia RPC URL**: Check if `SEPOLIA_RPC_URL` is correctly configured
- **RPC rate limits**: Some RPC providers have rate limits
- **Network connectivity**: Ensure the backend can reach the RPC endpoint

#### **Token Contract Issues**

- **Token contracts don't exist**: The vault might reference non-existent token contracts
- **Token contracts not ERC20**: The tokens might not implement the standard ERC20 interface
- **Token decimals call fails**: Some tokens might not have a `decimals()` function

### 2. **Debugging Steps**

#### **Step 1: Check Backend Logs**

Look for these log messages in your backend:

```
Getting vault token info for address: 0x...
Fetching token addresses from vault...
Token addresses fetched: { depositToken: '0x...', ... }
Fetching token decimals...
Token decimals fetched: { depositTokenDecimals: 18, ... }
```

#### **Step 2: Test Vault Address**

Verify the vault address is valid:

```bash
# Check if it's a valid Ethereum address
node -e "console.log(require('ethers').utils.isAddress('0x...'))"
```

#### **Step 3: Test RPC Connection**

```bash
# Test RPC connection
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_SEPOLIA_RPC_URL
```

#### **Step 4: Test Vault Contract**

```javascript
// Test if vault contract exists and has required functions
const provider = new ethers.providers.JsonRpcProvider('YOUR_RPC_URL');
const vaultContract = new ethers.Contract(
  vaultAddress,
  [
    'function depositToken() external view returns (address)',
    'function conversionToken() external view returns (address)',
    'function premiumToken() external view returns (address)',
  ],
  provider
);

try {
  const depositToken = await vaultContract.depositToken();
  console.log('Deposit token:', depositToken);
} catch (error) {
  console.error('Vault contract error:', error.message);
}
```

### 3. **Fallback Mechanism**

The code now includes a fallback mechanism:

- If vault token info fetching fails, it falls back to 18 decimals for all tokens
- This ensures the job can still be created even if vault info is unavailable
- Check logs for "Falling back to default 18 decimals" message

### 4. **Common Error Messages**

#### **"Invalid vault address"**

- The vault address is not a valid Ethereum address
- Check the address format (should start with 0x and be 42 characters long)

#### **"Failed to fetch vault token info"**

- The vault contract doesn't exist or doesn't implement the required interface
- RPC connection issues
- Network problems

#### **"Token contract not found"**

- The vault references token contracts that don't exist
- The tokens are not deployed on Sepolia

### 5. **Testing with Known Vault**

If you have a known working Derifun vault address on Sepolia, test with that first to verify the functionality works.

### 6. **Environment Variables**

Ensure these are set correctly:

- `SEPOLIA_RPC_URL`: Valid Sepolia RPC endpoint
- `VINCENT_APP_ID`: Your Vincent app ID
- `VINCENT_DELEGATEE_PRIVATE_KEY`: Your delegatee private key

### 7. **Frontend Error Handling**

The frontend now shows more detailed error messages. Check the browser console for:

- Specific error messages from the backend
- Stack traces (in development mode)
- Network request details
