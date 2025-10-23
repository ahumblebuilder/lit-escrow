import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBackend } from '@/hooks/useBackend';

export const Presentation: React.FC = () => {
  const { getJwt, createTransferJob } = useBackend();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateJob = async () => {
    if (!recipientAddress || !amount) {
      alert('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      await createTransferJob({
        recipientAddress,
        tokenAddress: '0x8E3D26D7f8b0508Bc2A9FC20342FF06FEEad1089', // Fixed token address
        amount: parseFloat(amount),
      });
      alert('Transfer job created successfully! It will run every minute.');
      setRecipientAddress('');
      setAmount('');
    } catch (error) {
      console.error('Error creating transfer job:', error);
      alert('Failed to create transfer job. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <Card
        data-testId="presentation"
        className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm"
      >
        <CardHeader className="text-center space-y-2">
          <CardTitle
            style={{
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontSize: '30px',
              fontWeight: 500,
              color: 'var(--footer-text-color, #121212)',
            }}
          >
            Vincent ERC20 Transfer Scheduler
          </CardTitle>
          <CardDescription
            className="uppercase tracking-widest"
            style={{
              fontFamily: 'Poppins, system-ui, sans-serif',
              fontSize: '15px',
              fontWeight: 500,
              color: '#FF4205',
            }}
          >
            Automated Token Transfers
          </CardDescription>
        </CardHeader>

        <Separator className="my-3" />

        <CardContent className="space-y-5">
          <p
            className="text-center text-base"
            style={{
              fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
              color: 'var(--footer-text-color, #121212)',
            }}
          >
            Schedule automated ERC20 token transfers on Sepolia testnet.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                type="text"
                placeholder="0x..."
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Transfer</Label>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="1.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <p
            className="text-sm text-center"
            style={{
              fontFamily: '"Encode Sans Semi Expanded", system-ui, sans-serif',
              color: 'var(--footer-text-color, #121212)',
            }}
          >
            This will create a job that transfers the specified amount of tokens every minute.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-3 pt-4">
          <Button onClick={handleCreateJob} variant="primary" size="lg" disabled={isCreating}>
            {isCreating ? 'Creating Job...' : 'Create Transfer Job'}
          </Button>
          <Button onClick={getJwt} variant="outline" size="lg">
            Connect with Vincent
          </Button>
          <a
            href="https://docs.heyvincent.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:opacity-80 underline"
            style={{
              color: '#FF4205',
              fontFamily: 'Poppins, system-ui, sans-serif',
            }}
          >
            Learn more about Vincent →
          </a>
        </CardFooter>
      </Card>
    </div>
  );
};
