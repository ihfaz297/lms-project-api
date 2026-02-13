import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { coursesAPI } from '@/lib/api';
import type { Course } from '@/lib/api';
import { GraduationCap, Users, Award, BookOpen, ArrowRight } from 'lucide-react';

export default function Landing() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    coursesAPI.getAll()
      .then(data => setCourses(data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Unlock Your Potential with{' '}
              <span className="text-primary">Expert-Led</span> Courses
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join thousands of learners mastering new skills with our curated courses 
              from industry professionals. Start your learning journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild>
                <Link to="/courses">
                  Explore Courses
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Become an Instructor</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: BookOpen, value: '5+', label: 'Expert Courses' },
              { icon: Users, value: '1000+', label: 'Active Learners' },
              { icon: GraduationCap, value: '3', label: 'Expert Instructors' },
              { icon: Award, value: '500+', label: 'Certificates Issued' },
            ].map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <stat.icon className="h-8 w-8 mx-auto text-primary" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Courses</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our most popular courses designed to help you achieve your goals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Button size="lg" variant="outline" asChild>
              <Link to="/courses">View All Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started is easy. Follow these simple steps to begin your learning journey.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up and set up your bank information for seamless transactions.',
              },
              {
                step: '02',
                title: 'Choose a Course',
                description: 'Browse our catalog and enroll in courses that match your interests.',
              },
              {
                step: '03',
                title: 'Get Certified',
                description: 'Complete courses and earn certificates to showcase your achievements.',
              },
            ].map((item, index) => (
              <div key={index} className="relative p-6 bg-background rounded-lg shadow-sm">
                <span className="text-5xl font-bold text-primary/10 absolute top-4 right-4">
                  {item.step}
                </span>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Join our community of learners and instructors. Start your journey today 
              and unlock new opportunities.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
