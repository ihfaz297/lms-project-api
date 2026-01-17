import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { mockTransactions } from '@/lib/mockData';
import { 
  Wallet, CreditCard, Shield, CheckCircle, 
  Loader2, DollarSign, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

export default function BankSetup() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [accountNumber, setAccountNumber] = useState('');
  const [secret, setSecret] = useState('');
  const [confirmSecret, setConfirmSecret] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (secret !== confirmSecret) {
      toast({
        title: 'Secrets do not match',
        description: 'Please make sure both secret fields match.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    // TODO: Replace with actual API call
    // await bankAPI.setupAccount({ accountNumber, secret });

    setTimeout(() => {
      updateUser({ hasBankSetup: true, bankAccountNumber: accountNumber });
      toast({
        title: 'Bank Account Linked!',
        description: 'Your bank account has been successfully set up.',
      });
      setIsSubmitting(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Bank Account</h1>
            <p className="text-muted-foreground">
              Manage your bank account and view transactions
            </p>
          </div>

          <Tabs defaultValue={user?.hasBankSetup ? 'overview' : 'setup'}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setup">
                {user?.hasBankSetup ? 'Update Account' : 'Setup Account'}
              </TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Account Balance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-primary mb-4">$0.00</div>
                    <Button className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Check Balance
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {user?.hasBankSetup ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Account Linked</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Account ending in •••• {user.bankAccountNumber?.slice(-4) || '0000'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          Setup Required
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          Link your bank account to enroll in courses and receive payments.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="setup">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {user?.hasBankSetup ? 'Update Bank Account' : 'Set Up Bank Account'}
                  </CardTitle>
                  <CardDescription>
                    Enter your bank account details to enable transactions on the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSetup} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        placeholder="Enter your bank account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secret">Transaction Secret</Label>
                      <Input
                        id="secret"
                        type="password"
                        placeholder="Create a secret for transactions"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        This secret will be used to authorize transactions. Keep it safe!
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmSecret">Confirm Secret</Label>
                      <Input
                        id="confirmSecret"
                        type="password"
                        placeholder="Confirm your transaction secret"
                        value={confirmSecret}
                        onChange={(e) => setConfirmSecret(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                      <Shield className="h-5 w-5 text-primary mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Your data is secure</p>
                        <p className="text-muted-foreground">
                          Your bank information is encrypted and never stored in plain text.
                        </p>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {user?.hasBankSetup ? 'Update Account' : 'Link Account'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    View all your payment and payout transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mockTransactions.length > 0 ? (
                    <div className="space-y-4">
                      {mockTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-4 p-4 rounded-lg border">
                          <div className={`p-3 rounded-full ${
                            tx.type === 'payment' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {tx.type === 'payment' ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{tx.courseName}</p>
                            <p className="text-sm text-muted-foreground">
                              {tx.type === 'payment' ? 'Course Payment' : 'Instructor Payout'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString()} • ID: {tx.id}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              tx.type === 'payment' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {tx.type === 'payment' ? '-' : '+'}${tx.amount.toFixed(2)}
                            </p>
                            <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
