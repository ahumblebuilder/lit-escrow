import React, { useState, FormEvent } from 'react';

import { useBackend } from '@/hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CreateOptionsProps {
  onCreate?: () => void;
}

// Predefined options
const DEPOSIT_TOKENS = [
  { address: '0x4200000000000000000000000000000000000006', symbol: 'WETH', name: 'Wrapped Ether' },
];

const OPTION_VAULTS = [
  { address: '0x1234567890123456789012345678901234567890', name: 'Vault 1' },
  { address: '0x2345678901234567890123456789012345678901', name: 'Vault 2' },
  { address: '0x3456789012345678901234567890123456789012', name: 'Vault 3' },
];

const getExpiryOptions = () => {
  const now = new Date();
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  return [
    {
      value: endOfCurrentMonth.toISOString(),
      label: `End of ${endOfCurrentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    },
    {
      value: endOfNextMonth.toISOString(),
      label: `End of ${endOfNextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
    },
  ];
};

const FREQUENCIES = [
  { value: '15 minutes', label: 'Every 15 minutes' },
  { value: '1 hour', label: 'Every hour' },
  { value: '12 hours', label: 'Every 12 hours' },
  { value: '1 day', label: 'Daily' },
];

export const CreateOptions: React.FC<CreateOptionsProps> = ({ onCreate }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [depositToken, setDepositToken] = useState<string>(DEPOSIT_TOKENS[0].address);
  const [vaultAddress, setVaultAddress] = useState<string>('');
  const [expiry, setExpiry] = useState<string>('');
  const [strikeThreshold, setStrikeThreshold] = useState<string>('');
  const [minimumApy, setMinimumApy] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<string>(FREQUENCIES[1].value); // Default to 1 hour
  const { createOptionsTrade } = useBackend();

  const handleCreateOptions = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!depositAmount || Number(depositAmount) <= 0) {
      alert('Please enter a positive deposit amount.');
      return;
    }
    if (!vaultAddress) {
      alert('Please select a vault.');
      return;
    }
    if (!expiry) {
      alert('Please select an expiry.');
      return;
    }
    if (!strikeThreshold || Number(strikeThreshold) <= 0) {
      alert('Please enter a positive strike threshold percentage.');
      return;
    }
    if (!minimumApy || Number(minimumApy) <= 0) {
      alert('Please enter a positive minimum APY percentage.');
      return;
    }
    if (!frequency) {
      alert('Please select a frequency.');
      return;
    }

    try {
      setLoading(true);
      await createOptionsTrade({
        depositToken,
        vaultAddress,
        expiry: new Date(expiry),
        strikeThreshold: Number(strikeThreshold),
        minimumApy: Number(minimumApy),
        depositAmount,
        frequency,
      });
      onCreate?.();
    } catch (error) {
      console.error('Error creating options trade:', error);
      alert('Error creating options trade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-between">
      <form onSubmit={handleCreateOptions}>
        <div className="text-center space-y-6">
          <div className="space-y-4 text-left bg-orange-50/60 p-4 rounded-lg border border-orange-100">
            <h3
              className="text-sm font-semibold"
              style={{
                fontFamily: 'Poppins, system-ui, sans-serif',
                color: '#FF4205',
              }}
            >
              How Options Trading Works (Powered by Vincent)
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                color: 'var(--footer-text-color, #121212)',
              }}
            >
              This options agent automatically executes options trades based on your predefined
              parameters. It will only execute when the strike price is at least your threshold
              percentage above the current spot price, and when the annualized option premium meets
              your minimum APY requirement.
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{
                fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
                color: 'var(--footer-text-color, #121212)',
              }}
            >
              The agent operates using permissions securely delegated by you, following strict rules
              you establish during setup—such as authorized abilities. These onchain rules are
              cryptographically enforced by{' '}
              <a
                href="https://litprotocol.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
                style={{ color: '#FF4205' }}
              >
                Lit Protocol
              </a>
              , ensuring every action stays within your guardrails.
            </p>
          </div>

          <div
            className="text-sm p-3 bg-blue-50 border border-blue-200 rounded-lg text-left"
            style={{
              fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
              color: 'var(--footer-text-color, #121212)',
            }}
          >
            <strong style={{ fontFamily: 'Poppins, system-ui, sans-serif' }}>Note:</strong> Ensure
            your wallet holds sufficient Base ETH for the app to function smoothly.
          </div>
        </div>

        <Separator className="my-8" />

        <div className="space-y-6">
          {/* Deposit Token Selection */}
          <div>
            <Label htmlFor="depositToken">Deposit Token</Label>
            <Select value={depositToken} onValueChange={setDepositToken} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select deposit token" />
              </SelectTrigger>
              <SelectContent>
                {DEPOSIT_TOKENS.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    {token.name} ({token.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vault Selection */}
          <div>
            <Label htmlFor="vault">Option Vault</Label>
            <Select value={vaultAddress} onValueChange={setVaultAddress} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select option vault" />
              </SelectTrigger>
              <SelectContent>
                {OPTION_VAULTS.map((vault) => (
                  <SelectItem key={vault.address} value={vault.address}>
                    {vault.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Selection */}
          <div>
            <Label htmlFor="expiry">Expiry</Label>
            <Select value={expiry} onValueChange={setExpiry} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select expiry" />
              </SelectTrigger>
              <SelectContent>
                {getExpiryOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strike Threshold */}
          <div>
            <Label htmlFor="strikeThreshold">Strike Threshold (%)</Label>
            <Input
              id="strikeThreshold"
              type="number"
              step="0.1"
              min="0"
              max="1000"
              value={strikeThreshold}
              onChange={(e) => setStrikeThreshold(e.target.value)}
              placeholder="e.g., 5.0 (strike must be 5% above current spot)"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum percentage above current spot price for strike to be considered
            </p>
          </div>

          {/* Minimum APY */}
          <div>
            <Label htmlFor="minimumApy">Minimum APY (%)</Label>
            <Input
              id="minimumApy"
              type="number"
              step="0.1"
              min="0"
              max="1000"
              value={minimumApy}
              onChange={(e) => setMinimumApy(e.target.value)}
              placeholder="e.g., 10.0 (minimum 10% annualized premium)"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum annualized option premium percentage required
            </p>
          </div>

          {/* Deposit Amount */}
          <div>
            <Label htmlFor="depositAmount">Deposit Amount</Label>
            <Input
              id="depositAmount"
              type="number"
              step="0.000001"
              min="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g., 1.0"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Amount of deposit token to use for options trading
            </p>
          </div>

          {/* Frequency Selection */}
          <div>
            <Label htmlFor="frequency">Check Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              How often to check for profitable options trades
            </p>
          </div>

          <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full">
            {loading ? 'Creating Options Trade...' : 'Create Options Trade →'}
          </Button>
        </div>
      </form>
    </div>
  );
};
