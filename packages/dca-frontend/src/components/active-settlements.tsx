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

interface Settlement {
  _id: string;
  ethAddress: string;
  ethPrice: number;
  wethAmount: string;
  usdcAmount: string;
  fromAddress: string;
  toAddress: string;
  validUntil: string;
  executed: boolean;
  txHash?: string;
  legsHash?: string;
  createdAt: string;
}

export const ActiveSettlements: React.FC = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getSettlements, cancelSettlement } = useBackend();

  const loadSettlements = useCallback(async () => {
    try {
      const data = await getSettlements();
      setSettlements(data);
    } catch (error) {
      console.error('Failed to load settlements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getSettlements]);

  useEffect(() => {
    loadSettlements();
  }, [loadSettlements]);

  const handleCancel = async (settlementId: string) => {
    try {
      await cancelSettlement(settlementId);
      await loadSettlements();
    } catch (error) {
      console.error('Failed to cancel settlement:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (settlement: Settlement) => {
    const now = new Date();
    const validUntil = new Date(settlement.validUntil);

    if (settlement.executed) {
      return <Badge className="bg-green-100 text-green-800">Executed</Badge>;
    } else if (now > validUntil) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    } else {
      return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Active Settlements</h2>
        <p>Loading settlements...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Active Settlements</h2>

      {settlements.length === 0 ? (
        <p className="text-gray-600">
          No settlements found. Create your first settlement to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>ETH Price</TableHead>
                <TableHead>WETH Amount</TableHead>
                <TableHead>USDC Amount</TableHead>
                <TableHead>From Address</TableHead>
                <TableHead>To Address</TableHead>
                <TableHead>Valid Until</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow key={settlement._id}>
                  <TableCell>{getStatusBadge(settlement)}</TableCell>
                  <TableCell>${settlement.ethPrice.toFixed(2)}</TableCell>
                  <TableCell>{settlement.wethAmount} WETH</TableCell>
                  <TableCell>{settlement.usdcAmount} USDC</TableCell>
                  <TableCell className="font-mono text-sm">
                    {settlement.fromAddress.slice(0, 6)}...{settlement.fromAddress.slice(-4)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {settlement.toAddress.slice(0, 6)}...{settlement.toAddress.slice(-4)}
                  </TableCell>
                  <TableCell>{formatDate(settlement.validUntil)}</TableCell>
                  <TableCell>{formatDate(settlement.createdAt)}</TableCell>
                  <TableCell>
                    {!settlement.executed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(settlement._id)}
                      >
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
