import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CourseCard from '@/components/courses/CourseCard';
import CourseCreateDialog from '@/components/courses/CourseCreateDialog';
import MaterialUploadDialog from '@/components/courses/MaterialUploadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  coursesAPI, bankAPI, authAPI, instructorAPI,
  Course, Certificate, Transaction, InstructorEarnings,
} from '@/lib/api';
import {
  BookOpen, Award, DollarSign, TrendingUp, Landmark,
  Clock, CheckCircle2, ArrowDownUp, Loader2, AlertTriangle,
} from 'lucide-react';

// ============================================
// Stat Card
// ============================================
const StatCard: React.FC<{ icon: React.ElementType; label: string; value: string | number }> = ({
  icon: Icon, label, value,
}) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-4">
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

// ============================================
// Learner Dashboard
// ============================================
const LearnerDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, certsData, txData] = await Promise.all([
          coursesAPI.getEnrolled(),
          authAPI.getCertificates(),
          bankAPI.getTransactions(),
        ]);
        setCourses(coursesData);
        setCertificates(certsData);
        setTransactions(txData);

        if (user?.hasBankSetup) {
          try {
            const bankData = await bankAPI.getBalance();
            setBalance(bankData.balance);
          } catch { /* ignore */ }
        }
      } catch {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.hasBankSetup]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)
    : 0;

  return (
    <div className="space-y-8">
      {/* Bank setup reminder */}
      {!user?.hasBankSetup && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 text-sm">Bank account not set up</p>
            <p className="text-xs text-amber-600">You need a bank account to enroll in courses.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/bank">Set Up Now</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Enrolled Courses" value={courses.length} />
        <StatCard icon={Award} label="Certificates" value={certificates.length} />
        <StatCard icon={TrendingUp} label="Avg. Progress" value={`${avgProgress}%`} />
        <StatCard icon={DollarSign} label="Balance" value={balance !== null ? `$${balance.toFixed(2)}` : 'N/A'} />
      </div>

      {/* Enrolled Courses */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Courses</h2>
        {courses.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">
            You haven't enrolled in any courses yet.{' '}
            <Link to="/courses" className="text-primary hover:underline">Browse courses</Link>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map(course => <CourseCard key={course.id} course={course} />)}
          </div>
        )}
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Certificates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map(cert => (
              <Card key={cert.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Award className="h-10 w-10 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{cert.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {transactions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {transactions.slice(0, 10).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{tx.courseName || 'Course Payment'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">-${tx.amount.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs capitalize">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================
// Instructor Dashboard
// ============================================
const InstructorDashboard = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [earnings, setEarnings] = useState<InstructorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const [coursesData, earningsData] = await Promise.all([
        instructorAPI.getCourses(),
        instructorAPI.getEarnings(),
      ]);
      setCourses(coursesData);
      setEarnings(earningsData);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWithdraw = async (transactionId: string) => {
    setWithdrawingId(transactionId);
    try {
      const result = await instructorAPI.withdrawEarnings(transactionId);
      toast.success(result.message);
      fetchData(); // Refresh data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Withdrawal failed');
    } finally {
      setWithdrawingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const pendingTx = earnings?.transactions.filter(t => t.status === 'pending') || [];

  return (
    <div className="space-y-8">
      {/* Bank setup reminder */}
      {!user?.hasBankSetup && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-amber-800 text-sm">Bank account not set up</p>
            <p className="text-xs text-amber-600">Set up your bank to receive course bonuses and withdrawals.</p>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/bank">Set Up Now</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="My Courses" value={courses.length} />
        <StatCard icon={DollarSign} label="Total Earnings" value={`$${(earnings?.total || 0).toFixed(2)}`} />
        <StatCard icon={Clock} label="Pending" value={`$${(earnings?.pending || 0).toFixed(2)}`} />
        <StatCard icon={Landmark} label="Bank Balance" value={earnings?.bankBalance !== null ? `$${(earnings?.bankBalance || 0).toFixed(2)}` : 'N/A'} />
      </div>

      {/* Create Course + My Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Courses</h2>
          <CourseCreateDialog onCourseCreated={fetchData} />
        </div>
        {courses.length === 0 ? (
          <Card><CardContent className="p-6 text-center text-muted-foreground">
            You haven't created any courses yet. Click "Create Course" to get started.
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {courses.map(course => (
              <Card key={course.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <Link to={`/courses/${course.id}`} className="font-medium hover:text-primary transition-colors truncate block">
                        {course.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        ${course.price.toFixed(2)} • {course.level} • {course.duration}
                      </p>
                    </div>
                  </div>
                  <MaterialUploadDialog courseId={course.id} onMaterialAdded={fetchData} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Transactions (G2) */}
      {pendingTx.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Pending Transactions
            <Badge variant="secondary" className="ml-2">{pendingTx.length}</Badge>
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {pendingTx.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium">{tx.courseName || 'Course Payment'}</p>
                      <p className="text-xs text-muted-foreground">
                        ${tx.amount.toFixed(2)} • {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleWithdraw(tx.id)}
                      disabled={withdrawingId === tx.id}
                    >
                      {withdrawingId === tx.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Withdraw
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Transactions */}
      {earnings && earnings.transactions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Transactions</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {earnings.transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{tx.courseName || 'Transaction'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">+${tx.amount.toFixed(2)}</p>
                      <Badge variant="outline" className="text-xs capitalize">{tx.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// ============================================
// Dashboard Page (Role-Aware)
// ============================================
const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            {user?.role === 'instructor' ? 'Instructor' : 'Learner'} Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}
          </p>
        </div>

        {user?.role === 'instructor' ? <InstructorDashboard /> : <LearnerDashboard />}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
