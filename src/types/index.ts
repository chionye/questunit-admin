/** @format */

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  accessToken?: string;
  data?: {
    token?: string;
    accessToken?: string;
    user?: User;
  };
  user?: User;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

// Dashboard types
export interface DashboardCounts {
  totalUsers: number;
  totalRequesters: number;
  totalRenderers: number;
  pendingRenderers: number;
  activeServices: number;
  activeTools: number;
}

export interface RecentUser {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  UserProfile: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface RecentService {
  id: number;
  name: string;
  category: string;
  status: string;
  createdAt: string;
}

export interface DashboardOverview {
  counts: DashboardCounts;
  recentActivities: {
    users: RecentUser[];
    services: RecentService[];
  };
}

// Renderer types
export interface Renderer {
  id: string;
  userId?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  documents?: Record<string, unknown>;
  skills?: string[];
  experience?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ApproveRendererRequest {
  notes?: string;
  hourlyRate?: number;
  availability?: Record<string, string[]>;
}

export interface RejectRendererRequest {
  reason: string;
  notes?: string;
}

// Service types
export interface Service {
  id: number;
  _id?: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  category?: string;
  basePrice?: string;
  currency?: string;
  estimatedDuration?: number | null;
  requirements?: Record<string, unknown> | null;
  safetyGuidelines?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  ServiceTypes?: ServiceType[];
  [key: string]: unknown;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  estimatedDuration?: number;
  isActive?: boolean;
}

// Service Type types
export interface ServiceType {
  id: string;
  _id?: string;
  serviceId?: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  basePrice?: number;
  estimatedDuration?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateServiceTypeRequest {
  serviceId: string;
  name: string;
  description?: string;
  basePrice?: number;
  estimatedDuration?: number;
}

export interface UpdateServiceTypeRequest {
  name?: string;
  description?: string;
  basePrice?: number;
  estimatedDuration?: number;
}

// Tool types
export interface Tool {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  requirements?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateToolRequest {
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  requirements?: Record<string, unknown>;
  status?: string;
}

export interface UpdateToolRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  requirements?: Record<string, unknown>;
  status?: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success?: boolean;
  results?: T;
  [key: string]: unknown;
}
