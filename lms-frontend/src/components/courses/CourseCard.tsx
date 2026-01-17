import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, BookOpen } from 'lucide-react';
import type { Course } from '@/lib/api';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const levelColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="aspect-video overflow-hidden">
        <img
          src={course.thumbnail || '/placeholder.svg'}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={levelColors[course.level]} variant="secondary">
            {course.level}
          </Badge>
          {course.enrolled && (
            <Badge variant="outline" className="text-primary border-primary">
              Enrolled
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {course.instructorName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xl font-bold text-primary">${course.price}</span>
        <Button asChild size="sm">
          <Link to={`/courses/${course.id}`}>
            <BookOpen className="h-4 w-4 mr-2" />
            {course.enrolled ? 'Continue' : 'View Course'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
