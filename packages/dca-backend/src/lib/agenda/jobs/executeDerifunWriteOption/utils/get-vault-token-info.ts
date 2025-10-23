import { ethers } from 'ethers';

// ABI for the IOptionVault interface
const IOPTION_VAULT_ABI = [
  'function depositToken() external view returns (address)',
  'function conversionToken() external view returns (address)',
  'function premiumToken() external view returns (address)',
  'function strike() external view returns (uint256)',
  'function expiry() external view returns (uint256)',
];

// ERC20 ABI for getting decimals
const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

// Helper to create a vault contract instance
export function getOptionVaultContract(address: string, provider: ethers.providers.Provider) {
  return new ethers.Contract(address, IOPTION_VAULT_ABI, provider);
}

// Helper to create an ERC20 contract instance
export function getERC20Contract(address: string, provider: ethers.providers.Provider) {
  return new ethers.Contract(address, ERC20_ABI, provider);
}

// Individual helper functions for vault info
export async function getDepositToken(contract: ethers.Contract): Promise<string> {
  return contract.depositToken() as Promise<string>;
}

export async function getConversionToken(contract: ethers.Contract): Promise<string> {
  return contract.conversionToken() as Promise<string>;
}

export async function getPremiumToken(contract: ethers.Contract): Promise<string> {
  return contract.premiumToken() as Promise<string>;
}

export async function getStrike(contract: ethers.Contract): Promise<ethers.BigNumber> {
  return contract.strike() as Promise<ethers.BigNumber>;
}

export async function getExpiry(contract: ethers.Contract): Promise<ethers.BigNumber> {
  return contract.expiry() as Promise<ethers.BigNumber>;
}

// Helper to get token decimals
export async function getTokenDecimals(
  tokenAddress: string,
  provider: ethers.providers.Provider
): Promise<number> {
  const tokenContract = getERC20Contract(tokenAddress, provider);
  return tokenContract.decimals() as Promise<number>;
}

// Main function to get all vault token info
export async function getVaultTokenInfo(
  vaultAddress: string,
  provider: ethers.providers.Provider
): Promise<{
  depositToken: string;
  conversionToken: string;
  premiumToken: string;
  depositTokenDecimals: number;
  conversionTokenDecimals: number;
  premiumTokenDecimals: number;
  strike: ethers.BigNumber;
  expiry: ethers.BigNumber;
}> {
  const vaultContract = getOptionVaultContract(vaultAddress, provider);

  // Get token addresses
  const [depositToken, conversionToken, premiumToken, strike, expiry] = await Promise.all([
    getDepositToken(vaultContract),
    getConversionToken(vaultContract),
    getPremiumToken(vaultContract),
    getStrike(vaultContract),
    getExpiry(vaultContract),
  ]);

  // Get token decimals
  const [depositTokenDecimals, conversionTokenDecimals, premiumTokenDecimals] = await Promise.all([
    getTokenDecimals(depositToken, provider),
    getTokenDecimals(conversionToken, provider),
    getTokenDecimals(premiumToken, provider),
  ]);

  return {
    depositToken,
    conversionToken,
    premiumToken,
    depositTokenDecimals,
    conversionTokenDecimals,
    premiumTokenDecimals,
    strike,
    expiry,
  };
}
