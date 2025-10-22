import React, { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CreateSettlement } from '@/components/create-settlement';
import { ActiveSettlements } from '@/components/active-settlements';
import { Wallet } from '@/components/wallet';
import { PageHeader } from '@/components/ui/page-header';

enum Tab {
  CreateSettlement = 'create-settlement',
  ActiveSettlements = 'active-settlements',
  Wallet = 'wallet',
}

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CreateSettlement);

  return (
    <main className="relative px-4 sm:px-6 md:px-8 flex justify-center pt-8 sm:pt-16 md:pt-24 pb-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm w-full">
          <PageHeader
            title="Vincent Settlement Agent"
            subtitle="Automated ETH Price-Based Settlements"
            description={
              <>
                This app uses the Vincent platform to securely and verifiably execute settlements
                based on ETH price movements. Learn more about{' '}
                <a
                  href="https://docs.heyvincent.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: '#FF4205' }}
                >
                  Vincent
                </a>
                .
              </>
            }
          />

          <Tabs
            data-testid="settlement-tabs"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as Tab)}
            className="w-full items-stretch"
          >
            <TabsList
              className="mb-4 flex space-x-2 rounded-md p-2 w-full mt-6"
              style={{ backgroundColor: 'transparent' }}
            >
              <TabsTrigger
                value={Tab.CreateSettlement}
                className="data-[state=active]:bg-[#FF4205]"
              >
                Create Settlement
              </TabsTrigger>
              <TabsTrigger
                value={Tab.ActiveSettlements}
                className="data-[state=active]:bg-[#FF4205]"
              >
                Active Settlements
              </TabsTrigger>
              <TabsTrigger value={Tab.Wallet} className="data-[state=active]:bg-[#FF4205]">
                Wallet
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
              <TabsContent value={Tab.CreateSettlement}>
                <CreateSettlement onCreate={() => setActiveTab(Tab.ActiveSettlements)} />
              </TabsContent>
              <TabsContent value={Tab.ActiveSettlements}>
                <ActiveSettlements />
              </TabsContent>
              <TabsContent value={Tab.Wallet}>
                <Wallet />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </main>
  );
};
