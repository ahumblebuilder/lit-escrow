# ERC20 Transfer Debugging Guide

## Common Issues and Solutions

### 1. Precheck Failures

The ERC20 transfer tool precheck can fail for several reasons:

#### **Parameter Mapping Issues** ⚠️ **COMMON**

- **Wrong parameter names**: ERC20 transfer ability expects `to` and `chain`, not `recipientAddress` and `chainId`
- **Wrong data types**: `chain` must be a string, not a number
- **Missing required fields**: All required parameters must be provided

**Fixed Parameter Mapping:**

```javascript
// ❌ Wrong (causes ZodError)
{
  chainId: 11155111,           // Should be 'chain'
  recipientAddress: '0x...',   // Should be 'to'
  tokenAddress: '0x...',
  amount: '1000000000000000000'
}

// ✅ Correct
{
  chain: '11155111',           // String, not number
  to: '0x...',                 // 'to' not 'recipientAddress'
  tokenAddress: '0x...',
  amount: '1000000000000000000'
}
```

#### **Token Contract Issues**

- **Invalid token address**: Ensure the token contract exists on Sepolia
- **Token not ERC20 compliant**: Some tokens may not follow standard ERC20 interface
- **Token paused/frozen**: Some tokens have pause mechanisms

#### **Network Issues**

- **Wrong chain ID**: Ensure using Sepolia (11155111)
- **RPC endpoint issues**: Check if RPC URL is accessible and working
- **Network congestion**: Sepolia can be slow during high usage

#### **Account Issues**

- **Insufficient balance**: User doesn't have enough tokens
- **Account not delegated**: User hasn't properly delegated to Vincent app
- **Permission revoked**: User revoked Vincent app permissions

### 2. Debugging Steps

#### **Check Token Contract**

```bash
# Verify token exists on Sepolia
curl -X POST https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [
      {
        "to": "0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089",
        "data": "0x70a08231000000000000000000000000ACCOUNT_ADDRESS"
      },
      "latest"
    ],
    "id": 1
  }'
```

#### **Check User Balance**

```bash
# Get token balance for user
curl -X POST https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [
      {
        "to": "0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089",
        "data": "0x70a08231000000000000000000000000USER_ADDRESS"
      },
      "latest"
    ],
    "id": 1
  }'
```

### 3. Enhanced Logging

The updated code now provides detailed logging:

#### **Transfer Parameters**

```javascript
{
  transferParams: {
    chainId: 11155111,
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/...",
    tokenAddress: "0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089",
    recipientAddress: "0xe44AA9c99e3b2271028F309d99417f12C9b1E704",
    amount: "200000000000000011"
  },
  transferContext: {
    delegatorPkpEthAddress: "0x1909F01E0aCB5c45d48a3Adfd8971C58aA2330dA"
  }
}
```

#### **Precheck Failure Details**

```javascript
{
  success: false,
  error: "Detailed error message",
  result: { /* precheck result object */ },
  transferParams: { /* parameters used */ },
  transferContext: { /* context used */ }
}
```

### 4. Common Solutions

#### **If Precheck Fails with "Insufficient Balance"**

1. Check if user has enough tokens
2. Verify token contract is working
3. Ensure RPC endpoint is accessible

#### **If Precheck Fails with "Permission Denied"**

1. Check if user has delegated to Vincent app
2. Verify Vincent app configuration
3. Check if user revoked permissions

#### **If Precheck Fails with "Invalid Token"**

1. Verify token address is correct
2. Check if token exists on Sepolia
3. Ensure token is ERC20 compliant

### 5. Testing Commands

#### **Test Token Contract**

```bash
# Get token name
curl -X POST YOUR_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_call",
    "params": [
      {"to": "0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089", "data": "0x06fdde03"},
      "latest"
    ],
    "id": 1
  }'
```

#### **Test User Delegation**

```bash
# Check if user has delegated to Vincent app
# This requires checking Vincent contracts on Sepolia
```

### 6. Environment Variables to Check

- `SEPOLIA_RPC_URL`: Must be accessible and working
- `VINCENT_APP_ID`: Must match the deployed Vincent app
- `VINCENT_DELEGATEE_PRIVATE_KEY`: Must be valid and have permissions
- `MONGODB_URI`: Must be accessible for job storage

### 7. Next Steps

1. **Redeploy** with enhanced logging
2. **Check logs** for detailed error information
3. **Verify** token contract and user balance
4. **Test** with a known working token if issues persist
