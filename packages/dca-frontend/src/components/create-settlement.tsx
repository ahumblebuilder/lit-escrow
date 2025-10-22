import React, { useState } from 'react';
import { useBackend } from '@/hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface CreateSettlementProps {
  onCreate: () => void;
}

export const CreateSettlement: React.FC<CreateSettlementProps> = ({ onCreate }) => {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createSettlement } = useBackend();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAddress || !toAddress) return;

    setIsLoading(true);
    try {
      await createSettlement({
        fromAddress,
        toAddress,
      });
      onCreate();
    } catch (error) {
      console.error('Failed to create settlement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Create Settlement</h2>
      <p className="text-gray-600 mb-6">
        Set up an automated settlement that runs every hour, fetching the current ETH price and
        creating payment legs: 1 WETH from address A to B, and USDC amount equal to the current ETH
        price from B to A.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fromAddress">From Address (Address A)</Label>
          <Input
            id="fromAddress"
            type="text"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div>
          <Label htmlFor="toAddress">To Address (Address B)</Label>
          <Input
            id="toAddress"
            type="text"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            placeholder="0x..."
            required
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Settlement Details</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Runs every hour</li>
            <li>• Fetches current ETH price from CoinGecko</li>
            <li>• Creates payment legs: 1 WETH (A→B) + ETH price in USDC (B→A)</li>
            <li>• USDC amount dynamically matches current ETH price</li>
            <li>• Valid for 60 minutes after creation</li>
            <li>• Uses Vincent EVM Transaction Signer</li>
          </ul>
        </div>

        <Button type="submit" disabled={isLoading || !fromAddress || !toAddress} className="w-full">
          {isLoading ? 'Creating Settlement...' : 'Create Settlement'}
        </Button>
      </form>
    </Card>
  );
};
