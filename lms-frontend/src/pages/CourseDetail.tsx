import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { coursesAPI } from '@/lib/api';
import type { Course, CourseMaterial } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, User, BookOpen, PlayCircle, FileText, 
  Headphones, HelpCircle, CheckCircle, Lock, ShoppingCart, ArrowLeft 
} from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      coursesAPI.getById(id).catch(() => null),
      coursesAPI.getMaterials(id).catch(() => [] as CourseMaterial[]),
    ]).then(([courseData, materialsData]) => {
      setCourse(courseData);
      setMaterials(materialsData);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12 text-center">
          <p className="text-muted-foreground">Loading course...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Course not found</h1>
          <Button asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isEnrolled = course.enrolled;
  const progress = course.progress || 0;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user?.hasBankSetup) {
      toast({
        title: 'Bank Setup Required',
        description: 'Please set up your bank information before enrolling.',
      });
      navigate('/bank');
      return;
    }

    setIsEnrolling(true);
    try {
      await coursesAPI.enroll(course.id);
      toast({
        title: 'Enrollment Successful!',
        description: `You are now enrolled in ${course.title}`,
      });
      // Refresh course data to update enrollment state
      const updated = await coursesAPI.getById(course.id);
      setCourse(updated);
    } catch (error: any) {
      toast({
        title: 'Enrollment Failed',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  const materialIcon = {
    video: PlayCircle,
    text: FileText,
    audio: Headphones,
    mcq: HelpCircle,
  };

  const levelColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Course Header */}
        <section className="py-8 bg-muted/30">
          <div className="container">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/courses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Link>
            </Button>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <Badge className={levelColors[course.level]}>{course.level}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
                <p className="text-lg text-muted-foreground">{course.description}</p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {course.instructorName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {materials.length} lessons
                  </span>
                </div>

                {isEnrolled && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </div>

              <div>
                <Card>
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={course.thumbnail || '/placeholder.svg'}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="text-3xl font-bold text-primary">${course.price}</div>
                    
                    {isEnrolled ? (
                      <Button className="w-full" size="lg">
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Continue Learning
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg" 
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {isEnrolling ? 'Processing...' : 'Enroll Now'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Course Content */}
        <section className="py-12">
          <div className="container">
            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {materials.map((material, index) => {
                    const Icon = materialIcon[material.type];
                    const isCompleted = material.completed;
                    const isLocked = !isEnrolled && index > 0;

                    return (
                      <li
                        key={material.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          isLocked ? 'opacity-50' : 'hover:bg-muted/50'
                        } transition-colors`}
                      >
                        <div className={`p-2 rounded-full ${
                          isCompleted 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : isLocked ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="font-medium">{material.title}</span>
                          <span className="ml-2 text-xs text-muted-foreground capitalize">
                            ({material.type})
                          </span>
                        </div>
                        {isEnrolled && !isLocked && (
                          <Button variant="ghost" size="sm">
                            {isCompleted ? 'Review' : 'Start'}
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
