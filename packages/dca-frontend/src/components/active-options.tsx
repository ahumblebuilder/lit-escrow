import React, { useCallback, useEffect, useState } from 'react';
import { useBackend } from '@/hooks/useBackend';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface OptionsTrade {
  _id: string;
  ethAddress: string;
  depositToken: string;
  vaultAddress: string;
  expiry: string;
  strikeThreshold: number;
  minimumApy: number;
  depositAmount: string;
  frequency: string;
  executed: boolean;
  txHash?: string;
  currentSpot?: number;
  optionPremium?: number;
  annualizedPremium?: number;
  createdAt: string;
}

export const ActiveOptions: React.FC = () => {
  const [optionsTrades, setOptionsTrades] = useState<OptionsTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getOptionsTrades, cancelOptionsTrade } = useBackend();

  const loadOptionsTrades = useCallback(async () => {
    try {
      const data = await getOptionsTrades();
      setOptionsTrades(data);
    } catch (error) {
      console.error('Failed to load options trades:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getOptionsTrades]);

  useEffect(() => {
    loadOptionsTrades();
  }, [loadOptionsTrades]);

  const handleCancel = async (tradeId: string) => {
    try {
      await cancelOptionsTrade(tradeId);
      await loadOptionsTrades();
    } catch (error) {
      console.error('Failed to cancel options trade:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (trade: OptionsTrade) => {
    const now = new Date();
    const expiry = new Date(trade.expiry);

    if (trade.executed) {
      return <Badge className="bg-green-100 text-green-800">Executed</Badge>;
    } else if (now > expiry) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
  };

  const getTokenSymbol = (address: string) => {
    if (address === '0x4200000000000000000000000000000000000006') return 'WETH';
    return 'Unknown';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Active Options Trades</h2>
        <p>Loading options trades...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Active Options Trades</h2>

      {optionsTrades.length === 0 ? (
        <p className="text-gray-600">
          No options trades found. Create your first options trade to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Vault</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Strike %</TableHead>
                <TableHead>Min APY %</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Current Spot</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {optionsTrades.map((trade) => (
                <TableRow key={trade._id}>
                  <TableCell>{getStatusBadge(trade)}</TableCell>
                  <TableCell>{getTokenSymbol(trade.depositToken)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {trade.vaultAddress.slice(0, 6)}...{trade.vaultAddress.slice(-4)}
                  </TableCell>
                  <TableCell>{formatDate(trade.expiry)}</TableCell>
                  <TableCell>{trade.frequency}</TableCell>
                  <TableCell>{trade.strikeThreshold}%</TableCell>
                  <TableCell>{trade.minimumApy}%</TableCell>
                  <TableCell>{trade.depositAmount}</TableCell>
                  <TableCell>
                    {trade.currentSpot ? `$${trade.currentSpot.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell>
                    {trade.annualizedPremium ? `${trade.annualizedPremium.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell>{formatDate(trade.createdAt)}</TableCell>
                  <TableCell>
                    {!trade.executed && (
                      <Button variant="outline" size="sm" onClick={() => handleCancel(trade._id)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
};
