import React, { useState } from 'react';
import { useJwtContext } from '@lit-protocol/vincent-app-sdk/react';
import { useBackend } from '@/hooks/useBackend';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const DerifunWriteOption: React.FC = () => {
  const { authInfo } = useJwtContext();
  const { getJwt, createDerifunWriteOptionJob } = useBackend();

  const [vault, setVault] = useState('');
  const [amount, setAmount] = useState('');
  const [strike, setStrike] = useState('');
  const [expiry, setExpiry] = useState('');
  const [premiumPerUnit, setPremiumPerUnit] = useState('');
  const [minDeposit, setMinDeposit] = useState('');
  const [maxDeposit, setMaxDeposit] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [signature, setSignature] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateJob = async () => {
    if (!authInfo?.jwt) {
      alert('Please connect with Vincent first before creating a Derifun write option job.');
      return;
    }

    if (
      !vault ||
      !amount ||
      !strike ||
      !expiry ||
      !premiumPerUnit ||
      !minDeposit ||
      !maxDeposit ||
      !validUntil ||
      !quoteId ||
      !signature
    ) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createDerifunWriteOptionJob({
        vault,
        amount: parseFloat(amount),
        strike: parseFloat(strike),
        expiry: parseInt(expiry),
        premiumPerUnit: parseFloat(premiumPerUnit),
        minDeposit: parseFloat(minDeposit),
        maxDeposit: parseFloat(maxDeposit),
        validUntil: parseInt(validUntil),
        quoteId,
        signature,
      });

      alert(`Derifun write option job created successfully! Job ID: ${result.id}`);

      // Reset form
      setVault('');
      setAmount('');
      setStrike('');
      setExpiry('');
      setPremiumPerUnit('');
      setMinDeposit('');
      setMaxDeposit('');
      setValidUntil('');
      setQuoteId('');
      setSignature('');
    } catch (error) {
      console.error('Error creating Derifun write option job:', error);
      alert('Failed to create Derifun write option job. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Derifun Write Option Scheduler</CardTitle>
        <CardDescription className="text-lg">
          Schedule automated Derifun option writing on Sepolia testnet.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-center text-muted-foreground">
          Schedule automated Derifun option writing operations on Sepolia testnet.
        </p>

        {authInfo?.jwt ? (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vault">Vault Address</Label>
                  <Input
                    id="vault"
                    placeholder="0x..."
                    value={vault}
                    onChange={(e) => setVault(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.000001"
                    placeholder="1.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strike">Strike Price</Label>
                  <Input
                    id="strike"
                    type="number"
                    step="0.000001"
                    placeholder="100.0"
                    value={strike}
                    onChange={(e) => setStrike(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry (Unix Timestamp)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    placeholder="1700000000"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premiumPerUnit">Premium Per Unit</Label>
                  <Input
                    id="premiumPerUnit"
                    type="number"
                    step="0.000001"
                    placeholder="0.1"
                    value={premiumPerUnit}
                    onChange={(e) => setPremiumPerUnit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minDeposit">Min Deposit</Label>
                  <Input
                    id="minDeposit"
                    type="number"
                    step="0.000001"
                    placeholder="1.0"
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDeposit">Max Deposit</Label>
                  <Input
                    id="maxDeposit"
                    type="number"
                    step="0.000001"
                    placeholder="10.0"
                    value={maxDeposit}
                    onChange={(e) => setMaxDeposit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until (Unix Timestamp)</Label>
                  <Input
                    id="validUntil"
                    type="number"
                    placeholder="1699999999"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quoteId">Quote ID</Label>
                  <Input
                    id="quoteId"
                    placeholder="12345"
                    value={quoteId}
                    onChange={(e) => setQuoteId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Signature</Label>
                <Input
                  id="signature"
                  placeholder="0x..."
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              This will create a job that writes Derifun options every minute.
            </p>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Please connect with Vincent to create Derifun write option jobs.
            </p>
            <p className="text-sm text-muted-foreground">
              You need to authenticate with Vincent and delegate your wallet to use this app.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-3 pt-4">
        {authInfo?.jwt ? (
          <>
            <Button onClick={handleCreateJob} variant="primary" size="lg" disabled={isCreating}>
              {isCreating ? 'Creating Job...' : 'Create Derifun Write Option Job'}
            </Button>
            <p className="text-sm text-green-600">Connected with Vincent ✓</p>
          </>
        ) : (
          <Button onClick={getJwt} variant="primary" size="lg">
            Connect with Vincent
          </Button>
        )}
        <a
          href="https://docs.litprotocol.com/vincent"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Learn more about Vincent →
        </a>
      </CardFooter>
    </Card>
  );
};
