import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { coursesAPI } from '@/lib/api';
import type { Course } from '@/lib/api';
import { Search } from 'lucide-react';

export default function Courses() {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesAPI.getAll()
      .then(data => setCourses(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = !levelFilter || course.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const levels = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Header */}
        <section className="py-12 bg-muted/30">
          <div className="container">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Explore Courses</h1>
            <p className="text-muted-foreground mb-6">
              Discover courses designed to help you achieve your learning goals
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={levelFilter === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLevelFilter(null)}
                >
                  All
                </Button>
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={levelFilter === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLevelFilter(level)}
                    className="capitalize"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Course Grid */}
        <section className="py-12">
          <div className="container">
            {filteredCourses.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No courses found matching your criteria.</p>
                <Button variant="link" onClick={() => { setSearch(''); setLevelFilter(null); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
