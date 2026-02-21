// ============================================
// LMS Frontend API Layer
// Derived from backend Mongoose schemas & route handlers
// ============================================

const API_BASE = 'http://localhost:3001/api';

// ============================================
// TypeScript Interfaces (from Mongoose Schemas)
// ============================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'learner' | 'instructor';
  hasBankSetup: boolean;
  bankAccountNumber: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructor: string;
  instructorName: string;
  thumbnail: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  // Enrichment fields (added when authenticated)
  enrolled?: boolean;
  progress?: number;
  completed?: boolean;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'text' | 'audio' | 'mcq';
  content: string;
  order: number;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  learnerId: string;
  courseId: string;
  isPaid: boolean;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  completedAt?: string;
}

export interface Certificate {
  id: string;
  learnerId: string;
  courseId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
}

export interface Transaction {
  id: string;
  learnerId: string;
  courseId: string;
  instructorId: string;
  amount: number;
  type: 'payment' | 'payout';
  status: 'pending' | 'completed' | 'failed' | 'validated';
  bankTransactionId: string;
  createdAt: string;
  completedAt?: string;
  courseName?: string;
}

export interface BankAccount {
  accountNumber: string;
  balance: number;
  type: 'learner' | 'instructor' | 'lms_org';
}

export interface InstructorEarnings {
  total: number;
  pending: number;
  transactions: Transaction[];
  bankBalance: number | null;
}

// ============================================
// Helper: Transform _id → id
// ============================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformId = <T extends Record<string, any>>(obj: T): T & { id: string } => {
  const { _id, ...rest } = obj;
  return { ...rest, id: _id || obj.id } as T & { id: string };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const transformArray = <T extends Record<string, any>>(arr: T[]): (T & { id: string })[] => {
  return arr.map(transformId);
};

// ============================================
// Auth Token Management
// ============================================
const getToken = (): string | null => localStorage.getItem('auth_token');

// ============================================
// Fetch Wrapper with 401 Interceptor (G9)
// ============================================
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Global 401 interceptor — token expired or invalid
  if (response.status === 401 || response.status === 403) {
    const data = await response.clone().json().catch(() => ({}));
    const errorMsg = data.error || '';
    // Only auto-logout for auth-related errors, not role-based 403s
    if (
      response.status === 401 ||
      errorMsg.includes('Invalid or expired token') ||
      errorMsg.includes('No token provided')
    ) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  return response;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleResponse = async <T = any>(response: Response): Promise<T> => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
};

// ============================================
// Auth API
// ============================================
export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'learner' | 'instructor';
  }): Promise<{ token: string; user: User }> => {
    const response = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ token: string; user: User }>(response);
    result.user = transformId(result.user);
    return result;
  },

  login: async (data: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: User }> => {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse<{ token: string; user: User }>(response);
    result.user = transformId(result.user);
    return result;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiFetch('/auth/profile');
    const data = await handleResponse<User>(response);
    return transformId(data);
  },

  getCertificates: async (): Promise<Certificate[]> => {
    const response = await apiFetch('/auth/certificates');
    const data = await handleResponse<Certificate[]>(response);
    return transformArray(data);
  },
};

// ============================================
// Courses API
// ============================================
export const coursesAPI = {
  getAll: async (): Promise<Course[]> => {
    const response = await apiFetch('/courses');
    const data = await handleResponse<Course[]>(response);
    return transformArray(data);
  },

  getEnrolled: async (): Promise<Course[]> => {
    const response = await apiFetch('/courses/enrolled');
    const data = await handleResponse<Course[]>(response);
    return transformArray(data);
  },

  getById: async (courseId: string): Promise<Course> => {
    const response = await apiFetch(`/courses/${courseId}`);
    const data = await handleResponse<Course>(response);
    return transformId(data);
  },

  create: async (data: {
    title: string;
    description: string;
    price: number;
    duration: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    thumbnail: string;
  }): Promise<{ message: string; course: Course; payout: { amount: number; status: string } }> => {
    const response = await apiFetch('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    result.course = transformId(result.course);
    return result;
  },

  getMaterials: async (courseId: string): Promise<CourseMaterial[]> => {
    const response = await apiFetch(`/courses/${courseId}/materials`);
    const data = await handleResponse<CourseMaterial[]>(response);
    return transformArray(data);
  },

  addMaterial: async (
    courseId: string,
    data: { title: string; type: string; content?: string; order?: number }
  ): Promise<{ message: string; newMaterial: CourseMaterial; payout: { amount: number; status: string } }> => {
    const response = await apiFetch(`/courses/${courseId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    result.newMaterial = transformId(result.newMaterial);
    return result;
  },

  enroll: async (
    courseId: string
  ): Promise<{ message: string; enrollment: Enrollment; transactionId: string }> => {
    const response = await apiFetch(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
    const result = await handleResponse(response);
    result.enrollment = transformId(result.enrollment);
    return result;
  },

  completeCourse: async (
    courseId: string
  ): Promise<{ message: string; certificate: Certificate }> => {
    const response = await apiFetch(`/courses/${courseId}/complete`, {
      method: 'POST',
    });
    const result = await handleResponse(response);
    result.certificate = transformId(result.certificate);
    return result;
  },
};

// ============================================
// Bank API
// ============================================
export const bankAPI = {
  setup: async (data: {
    accountNumber: string;
    secret: string;
  }): Promise<{ message: string; account: BankAccount }> => {
    const response = await apiFetch('/bank/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getBalance: async (): Promise<BankAccount> => {
    const response = await apiFetch('/bank/balance');
    return handleResponse<BankAccount>(response);
  },

  getTransactions: async (): Promise<Transaction[]> => {
    const response = await apiFetch('/bank/transactions');
    const data = await handleResponse<Transaction[]>(response);
    return transformArray(data);
  },
};

// ============================================
// Instructor API
// ============================================
export const instructorAPI = {
  getCourses: async (): Promise<Course[]> => {
    const response = await apiFetch('/instructor/courses');
    const data = await handleResponse<Course[]>(response);
    return transformArray(data);
  },

  getEarnings: async (): Promise<InstructorEarnings> => {
    const response = await apiFetch('/instructor/earnings');
    const data = await handleResponse<InstructorEarnings>(response);
    data.transactions = transformArray(data.transactions);
    return data;
  },

  withdrawEarnings: async (
    transactionId: string
  ): Promise<{ message: string; transaction: Transaction }> => {
    const response = await apiFetch(`/instructor/withdraw/${transactionId}`, {
      method: 'POST',
    });
    const result = await handleResponse(response);
    result.transaction = transformId(result.transaction);
    return result;
  },
};
