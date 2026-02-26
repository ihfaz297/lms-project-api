import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import EnrollConfirmDialog from '@/components/courses/EnrollConfirmDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { coursesAPI, bankAPI, Course, CourseMaterial } from '@/lib/api';
import {
  ArrowLeft, Clock, User, DollarSign, BookOpen, Video, FileText, Music, HelpCircle,
  CheckCircle2, Lock, Loader2, AlertTriangle, Award,
} from 'lucide-react';

const materialTypeIcons: Record<string, React.ElementType> = {
  video: Video,
  text: FileText,
  audio: Music,
  mcq: HelpCircle,
};

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [courseData, materialsData] = await Promise.all([
          coursesAPI.getById(id),
          coursesAPI.getMaterials(id),
        ]);
        setCourse(courseData);
        setMaterials(materialsData);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Fetch balance when user clicks enroll (for confirmation dialog)
  const handleEnrollClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!user.hasBankSetup) {
      toast.error('Please set up your bank account first.');
      navigate('/bank');
      return;
    }
    // Fetch balance for confirmation dialog
    try {
      const bankData = await bankAPI.getBalance();
      setBalance(bankData.balance);
    } catch {
      setBalance(null);
    }
    setShowEnrollDialog(true);
  };

  const handleEnrollConfirm = async () => {
    if (!id) return;
    setEnrolling(true);
    try {
      const result = await coursesAPI.enroll(id);
      toast.success(result.message);
      // Refresh course data to get updated enrollment status
      const updatedCourse = await coursesAPI.getById(id);
      setCourse(updatedCourse);
      setShowEnrollDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setCompleting(true);
    try {
      const result = await coursesAPI.completeCourse(id);
      toast.success(result.message);
      // Show certificate info
      if (result.certificate) {
        toast.success(`Certificate issued for "${result.certificate.courseName}"`, {
          description: `Issued to ${result.certificate.userName} on ${new Date(result.certificate.issuedAt).toLocaleDateString()}`,
          duration: 8000,
        });
      }
      // Refresh course data
      const updatedCourse = await coursesAPI.getById(id);
      setCourse(updatedCourse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete course');
    } finally {
      setCompleting(false);
    }
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Course Not Found</h2>
            <p className="text-muted-foreground">The course you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/courses">Browse Courses</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link to="/courses">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thumbnail */}
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <BookOpen className="h-16 w-16 text-primary/30" />
                </div>
              )}
            </div>

            {/* Course Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={levelColors[course.level]}>
                  {course.level}
                </Badge>
                {course.enrolled && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Enrolled</Badge>
                )}
                {course.completed && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground text-lg">{course.description}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-4 w-4" />{course.instructorName}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration}</span>
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{course.price.toFixed(2)}</span>
              </div>

              {/* Progress */}
              {course.enrolled && !course.completed && course.progress !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}
            </div>

            {/* Materials */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Course Materials</h2>
              {materials.length === 0 ? (
                <p className="text-muted-foreground text-sm">No materials available yet.</p>
              ) : (
                <div className="space-y-2">
                  {materials.map((material) => {
                    const Icon = materialTypeIcons[material.type] || FileText;
                    const isAccessible = course.enrolled;

                    return (
                      <Card key={material.id} className={!isAccessible ? 'opacity-60' : ''}>
                        <CardContent className="flex items-center gap-3 p-4">
                          <div className={`p-2 rounded-lg ${isAccessible ? 'bg-primary/10' : 'bg-muted'}`}>
                            {isAccessible ? (
                              <Icon className="h-4 w-4 text-primary" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{material.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{material.type}</p>
                          </div>
                          {isAccessible && material.content && (
                            <Badge variant="outline" className="text-xs">
                              {material.type === 'video' ? 'Watch' : material.type === 'audio' ? 'Listen' : 'Read'}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div className="text-3xl font-bold text-primary flex items-center">
                  <DollarSign className="h-7 w-7" />
                  {course.price.toFixed(2)}
                </div>

                {/* Action Buttons based on state */}
                {!course.enrolled && user?.role !== 'instructor' && (
                  <>
                    {/* Bank setup gate (G16) */}
                    {user && !user.hasBankSetup && (
                      <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium">Bank account required</p>
                          <Link to="/bank" className="text-xs underline">Set up your bank account</Link>
                        </div>
                      </div>
                    )}
                    <Button className="w-full" size="lg" onClick={handleEnrollClick}>
                      Enroll Now
                    </Button>
                  </>
                )}

                {course.enrolled && !course.completed && (
                  <div className="space-y-3">
                    {/* isPaid state awareness (G5) */}
                    <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium">Enrolled</p>
                        <p className="text-xs">
                          Your payment is being processed. Once the instructor validates the transaction, you can complete this course.
                        </p>
                      </div>
                    </div>

                    {/* Complete Course button (G1) */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleComplete}
                      disabled={completing}
                    >
                      {completing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Complete Course
                    </Button>
                  </div>
                )}

                {course.completed && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                      <Award className="h-5 w-5" />
                      <div>
                        <p className="font-medium text-sm">Course Completed!</p>
                        <p className="text-xs">Certificate has been issued.</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/dashboard">View Certificate</Link>
                    </Button>
                  </div>
                )}

                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    <Link to="/login" className="text-primary hover:underline">Sign in</Link> to enroll
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Enrollment confirmation dialog (G11) */}
      {course && (
        <EnrollConfirmDialog
          open={showEnrollDialog}
          onOpenChange={setShowEnrollDialog}
          courseName={course.title}
          coursePrice={course.price}
          balance={balance}
          onConfirm={handleEnrollConfirm}
          loading={enrolling}
        />
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
