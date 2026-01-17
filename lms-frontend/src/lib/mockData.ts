// Mock data for UI development - remove when connecting to real backend

import type { Course, CourseMaterial, User, Certificate, Transaction } from './api';

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'learner',
  hasBankSetup: false,
};

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites.',
    price: 49.99,
    instructorId: 'inst1',
    instructorName: 'Dr. Sarah Chen',
    duration: '8 hours',
    level: 'beginner',
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including hooks, context, and performance optimization.',
    price: 79.99,
    instructorId: 'inst2',
    instructorName: 'Prof. Michael Torres',
    duration: '12 hours',
    level: 'advanced',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Node.js Backend Development',
    description: 'Build scalable REST APIs with Node.js, Express, and MongoDB.',
    price: 69.99,
    instructorId: 'inst1',
    instructorName: 'Dr. Sarah Chen',
    duration: '10 hours',
    level: 'intermediate',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    title: 'Database Design Fundamentals',
    description: 'Learn SQL, database normalization, and how to design efficient schemas.',
    price: 59.99,
    instructorId: 'inst3',
    instructorName: 'Dr. Emily Watson',
    duration: '6 hours',
    level: 'beginner',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop',
  },
  {
    id: '5',
    title: 'DevOps Essentials',
    description: 'Master CI/CD, Docker, Kubernetes, and cloud deployment strategies.',
    price: 89.99,
    instructorId: 'inst2',
    instructorName: 'Prof. Michael Torres',
    duration: '15 hours',
    level: 'advanced',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=300&fit=crop',
  },
];

export const mockMaterials: CourseMaterial[] = [
  { id: 'm1', courseId: '1', title: 'Introduction to HTML', type: 'video', content: 'video_url', order: 1 },
  { id: 'm2', courseId: '1', title: 'HTML Elements & Attributes', type: 'text', content: 'Learn about...', order: 2 },
  { id: 'm3', courseId: '1', title: 'CSS Basics', type: 'video', content: 'video_url', order: 3 },
  { id: 'm4', courseId: '1', title: 'HTML & CSS Quiz', type: 'mcq', content: 'quiz_data', order: 4 },
];

export const mockCertificates: Certificate[] = [];

export const mockTransactions: Transaction[] = [
  { id: 't1', amount: 49.99, type: 'payment', status: 'completed', createdAt: '2024-01-15', courseId: '1', courseName: 'Introduction to Web Development' },
  { id: 't2', amount: 35.00, type: 'payout', status: 'pending', createdAt: '2024-01-16', courseId: '1', courseName: 'Introduction to Web Development' },
];
