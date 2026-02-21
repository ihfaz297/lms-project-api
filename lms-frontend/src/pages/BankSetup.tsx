import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { bankAPI, Transaction } from '@/lib/api';
import {
  Landmark, Loader2, DollarSign, ArrowDownUp, CheckCircle2,
  Wallet, ArrowRight,
} from 'lucide-react';

const BankSetup = () => {
  const { user, updateUser } = useAuth();

  // Setup form state
  const [accountNumber, setAccountNumber] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Bank data
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const isSetup = user?.hasBankSetup;

  const fetchBankData = useCallback(async () => {
    if (!isSetup) return;
    setDataLoading(true);
    try {
      const [balanceData, txData] = await Promise.all([
        bankAPI.getBalance(),
        bankAPI.getTransactions(),
      ]);
      setBalance(balanceData.balance);
      setTransactions(txData);
    } catch {
      // ignore
    } finally {
      setDataLoading(false);
    }
  }, [isSetup]);

  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accountNumber || !secret) {
      toast.error('Account number and secret are required');
      return;
    }
    if (accountNumber.length < 10) {
      toast.error('Account number must be at least 10 characters');
      return;
    }
    if (secret.length < 6) {
      toast.error('Secret must be at least 6 characters');
      return;
    }
    if (secret !== confirmSecret) {
      toast.error('Secrets do not match');
      return;
    }

    setSetupLoading(true);
    try {
      const result = await bankAPI.setup({ accountNumber, secret });
      toast.success(result.message);
      // Update auth context so hasBankSetup reflects immediately
      updateUser({
        hasBankSetup: true,
        bankAccountNumber: accountNumber,
      });
      // Reset form
      setAccountNumber('');
      setSecret('');
      setConfirmSecret('');
      // Fetch bank data now
      fetchBankData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bank setup failed');
    } finally {
      setSetupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Landmark className="h-8 w-8 text-primary" />
            Bank Account
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your bank account for course transactions
          </p>
        </div>

        {isSetup ? (
          <Tabs defaultValue="overview">
            <TabsList className="w-full">
              <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
              <TabsTrigger value="update" className="flex-1">Update Account</TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1">Transactions</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {dataLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              ) : (
                <>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Wallet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-3xl font-bold flex items-center">
                          <DollarSign className="h-6 w-6" />
                          {balance !== null ? balance.toFixed(2) : '—'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Account Connected</p>
                        <p className="text-xs text-muted-foreground">
                          Account: {user?.bankAccountNumber ? `****${user.bankAccountNumber.slice(-4)}` : 'Connected'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Update */}
            <TabsContent value="update" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Update Bank Account</CardTitle>
                  <CardDescription>
                    Connect a different bank account to your LearnHub profile.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SetupForm
                    accountNumber={accountNumber}
                    setAccountNumber={setAccountNumber}
                    secret={secret}
                    setSecret={setSecret}
                    confirmSecret={confirmSecret}
                    setConfirmSecret={setConfirmSecret}
                    loading={setupLoading}
                    onSubmit={handleSetup}
                    buttonText="Update Account"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions */}
            <TabsContent value="transactions" className="mt-4">
              {dataLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : transactions.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No transactions yet.
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {transactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{tx.courseName || tx.type}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${tx.type === 'payout' ? 'text-green-600' : ''}`}>
                              {tx.type === 'payout' ? '+' : '-'}${tx.amount.toFixed(2)}
                            </p>
                            <Badge variant="outline" className="text-xs capitalize">{tx.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* First-time setup */
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Bank Account</CardTitle>
              <CardDescription>
                Connect your existing bank account to enable course purchases and receive earnings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SetupForm
                accountNumber={accountNumber}
                setAccountNumber={setAccountNumber}
                secret={secret}
                setSecret={setSecret}
                confirmSecret={confirmSecret}
                setConfirmSecret={setConfirmSecret}
                loading={setupLoading}
                onSubmit={handleSetup}
                buttonText="Connect Account"
              />
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};

// ============================================
// Setup Form (shared between first setup and update)
// ============================================
interface SetupFormProps {
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  secret: string;
  setSecret: (v: string) => void;
  confirmSecret: string;
  setConfirmSecret: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  buttonText: string;
}

const SetupForm: React.FC<SetupFormProps> = ({
  accountNumber, setAccountNumber,
  secret, setSecret,
  confirmSecret, setConfirmSecret,
  loading, onSubmit, buttonText,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="accountNumber">Bank Account Number</Label>
      <Input
        id="accountNumber"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        placeholder="Enter your bank account number"
        minLength={10}
        required
      />
      <p className="text-xs text-muted-foreground">
        Enter your existing bank account number (minimum 10 characters).
      </p>
    </div>
    <div className="space-y-2">
      <Label htmlFor="secret">Account Secret</Label>
      <Input
        id="secret"
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="Enter your bank account secret"
        minLength={6}
        required
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor="confirmSecret">Confirm Secret</Label>
      <Input
        id="confirmSecret"
        type="password"
        value={confirmSecret}
        onChange={(e) => setConfirmSecret(e.target.value)}
        placeholder="Confirm your bank account secret"
        minLength={6}
        required
      />
    </div>
    <Button type="submit" className="w-full" disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <ArrowRight className="h-4 w-4 mr-2" />
      )}
      {buttonText}
    </Button>
  </form>
);

export default BankSetup;
