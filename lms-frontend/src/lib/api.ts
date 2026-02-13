// ===========================================
// API SERVICE - Connect to your Node.js backend
// ===========================================
// Replace BASE_URL with your actual backend URL

const BASE_URL = 'http://localhost:3001/api';

// Helper to make API calls
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  
  return response.json();
}

// ===========================================
// AUTH API
// ===========================================
export const authAPI = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { name: string; email: string; password: string; role: 'learner' | 'instructor' }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getProfile: () => request<User>('/auth/profile'),

  getCertificates: () => request<Certificate[]>('/auth/certificates'),
};

// ===========================================
// COURSES API
// ===========================================
export const coursesAPI = {
  getAll: () => request<Course[]>('/courses'),

  getById: (id: string) => request<Course>(`/courses/${id}`),

  create: (data: Partial<Course>) =>
    request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  enroll: (courseId: string) =>
    request<{ message: string }>(`/courses/${courseId}/enroll`, {
      method: 'POST',
    }),

  getMaterials: (courseId: string) =>
    request<CourseMaterial[]>(`/courses/${courseId}/materials`),

  addMaterial: (courseId: string, data: Partial<CourseMaterial>) =>
    request<CourseMaterial>(`/courses/${courseId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  completeCourse: (courseId: string) =>
    request<{ certificate: Certificate }>(`/courses/${courseId}/complete`, {
      method: 'POST',
    }),

  getEnrolled: () => request<Course[]>('/courses/enrolled'),
};

// ===========================================
// BANK API
// ===========================================
export const bankAPI = {
  setupAccount: (data: { accountNumber: string; secret: string }) =>
    request<{ message: string }>('/bank/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBalance: () => request<{ balance: number }>('/bank/balance'),

  processPayment: (data: { courseId: string; amount: number }) =>
    request<{ transactionId: string; message: string }>('/bank/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  validateTransaction: (transactionId: string) =>
    request<{ status: string }>(`/bank/transactions/${transactionId}/validate`, {
      method: 'POST',
    }),

  getTransactions: () => request<Transaction[]>('/bank/transactions'),
};

// ===========================================
// INSTRUCTOR API
// ===========================================
export const instructorAPI = {
  getCourses: () => request<Course[]>('/instructor/courses'),

  getEarnings: () => request<{ total: number; pending: number; transactions: Transaction[] }>('/instructor/earnings'),

  withdrawEarnings: (transactionId: string) =>
    request<{ message: string }>(`/instructor/withdraw/${transactionId}`, {
      method: 'POST',
    }),
};

// ===========================================
// TYPES
// ===========================================
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'instructor' | 'admin';
  bankAccountNumber?: string;
  hasBankSetup?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  instructorName: string;
  thumbnail?: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  enrolled?: boolean;
  completed?: boolean;
  progress?: number;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'text' | 'audio' | 'mcq';
  content: string;
  order: number;
  completed?: boolean;
}

export interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'payment' | 'payout';
  status: 'pending' | 'completed' | 'validated';
  createdAt: string;
  courseId?: string;
  courseName?: string;
}
