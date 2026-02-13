import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { coursesAPI, instructorAPI, bankAPI, authAPI } from '@/lib/api';
import type { Course, Certificate, Transaction } from '@/lib/api';
import { 
  BookOpen, Award, Wallet, TrendingUp, 
  PlayCircle, Plus, DollarSign, AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [earnings, setEarnings] = useState<{ total: number; pending: number } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const isInstructor = user?.role === 'instructor';

  useEffect(() => {
    if (!isAuthenticated || isLoading) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const promises: Promise<void>[] = [];

        // Fetch courses
        if (isInstructor) {
          promises.push(
            instructorAPI.getCourses().then(data => setCourses(data)).catch(() => {})
          );
          promises.push(
            instructorAPI.getEarnings().then(data => {
              setEarnings({ total: data.total, pending: data.pending });
              setTransactions(data.transactions);
            }).catch(() => {})
          );
        } else {
          promises.push(
            coursesAPI.getEnrolled().then(data => setCourses(data)).catch(() => {})
          );
          promises.push(
            bankAPI.getTransactions().then(data => setTransactions(data)).catch(() => {})
          );
        }

        // Fetch certificates
        promises.push(
          authAPI.getCertificates().then(data => setCertificates(data)).catch(() => {})
        );

        // Fetch bank balance
        if (user?.hasBankSetup) {
          promises.push(
            bankAPI.getBalance().then(data => setBalance(data.balance)).catch(() => {})
          );
        }

        await Promise.all(promises);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, isLoading, isInstructor, user?.hasBankSetup]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const avgProgress = courses.length > 0 && !isInstructor
    ? Math.round(courses.reduce((sum, c) => sum + (c.progress || 0), 0) / courses.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-muted-foreground">
              {isInstructor 
                ? 'Manage your courses and track your earnings' 
                : 'Continue your learning journey'}
            </p>
          </div>

          {/* Bank Setup Alert */}
          {!user?.hasBankSetup && (
            <Card className="mb-6 border-secondary bg-secondary/5">
              <CardContent className="flex items-center gap-4 p-4">
                <AlertCircle className="h-6 w-6 text-secondary" />
                <div className="flex-1">
                  <p className="font-medium">Set up your bank account</p>
                  <p className="text-sm text-muted-foreground">
                    You need to set up your bank information before you can enroll in courses.
                  </p>
                </div>
                <Button asChild>
                  <Link to="/bank">Set Up Now</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isInstructor ? 'My Courses' : 'Enrolled Courses'}
                    </p>
                    <p className="text-2xl font-bold">
                      {courses.length}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-primary opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Certificates</p>
                    <p className="text-2xl font-bold">{certificates.length}</p>
                  </div>
                  <Award className="h-8 w-8 text-secondary opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isInstructor ? 'Total Earnings' : 'Balance'}
                    </p>
                    <p className="text-2xl font-bold">
                      ${isInstructor ? (earnings?.total ?? 0).toFixed(2) : (balance ?? 0).toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isInstructor ? 'Pending' : 'Progress'}
                    </p>
                    <p className="text-2xl font-bold">
                      {isInstructor ? `$${(earnings?.pending ?? 0).toFixed(2)}` : `${avgProgress}%`}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Courses Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{isInstructor ? 'My Courses' : 'My Learning'}</CardTitle>
                  {isInstructor && (
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {dataLoading ? (
                    <p className="text-center py-8 text-muted-foreground">Loading...</p>
                  ) : courses.length > 0 ? (
                    <ul className="space-y-4">
                      {courses.map((course) => (
                        <li key={course.id} className="flex items-center gap-4 p-3 rounded-lg border">
                          <img
                            src={course.thumbnail || '/placeholder.svg'}
                            alt={course.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{course.title}</h4>
                            {!isInstructor && course.progress !== undefined && (
                              <div className="flex items-center gap-2 mt-1">
                                <Progress value={course.progress} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground">
                                  {course.progress}%
                                </span>
                              </div>
                            )}
                            {isInstructor && (
                              <p className="text-sm text-muted-foreground">
                                ${course.price} • {course.level}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/courses/${course.id}`}>
                              <PlayCircle className="h-4 w-4" />
                            </Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        {isInstructor 
                          ? "You haven't created any courses yet" 
                          : "You haven't enrolled in any courses yet"}
                      </p>
                      <Button asChild>
                        <Link to="/courses">Browse Courses</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certificates */}
              <Card>
                <CardHeader>
                  <CardTitle>Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  {certificates.length > 0 ? (
                    <ul className="space-y-2">
                      {certificates.map((cert) => (
                        <li key={cert.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <Award className="h-8 w-8 text-secondary" />
                          <div className="flex-1">
                            <p className="font-medium">{cert.courseName}</p>
                            <p className="text-sm text-muted-foreground">
                              Issued on {new Date(cert.issuedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="outline" size="sm">View</Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground">
                      Complete a course to earn your first certificate!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Recent Transactions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <ul className="space-y-3">
                      {transactions.slice(0, 5).map((tx) => (
                        <li key={tx.id} className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            tx.type === 'payment' 
                              ? 'bg-red-100 text-red-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            <DollarSign className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{tx.courseName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${
                              tx.type === 'payment' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {tx.type === 'payment' ? '-' : '+'}${tx.amount}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {tx.status}
                            </Badge>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center py-4 text-muted-foreground text-sm">
                      No transactions yet
                    </p>
                  )}
                  <Button variant="link" className="w-full mt-4" asChild>
                    <Link to="/bank">View All Transactions</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse Courses
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/bank">
                      <Wallet className="h-4 w-4 mr-2" />
                      Manage Bank Account
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
