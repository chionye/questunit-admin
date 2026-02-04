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
export interface DashboardOverview {
  totalUsers?: number;
  totalRenderers?: number;
  pendingRenderers?: number;
  totalServices?: number;
  totalBookings?: number;
  totalRevenue?: number;
  recentActivity?: Activity[];
  stats?: Record<string, number>;
  [key: string]: unknown;
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  [key: string]: unknown;
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
  id: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  duration?: number;
  requirements?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category?: string;
  basePrice?: number;
  duration?: number;
  requirements?: Record<string, unknown>;
  status?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  duration?: number;
  requirements?: Record<string, unknown>;
  status?: string;
}

// Service Type types
export interface ServiceType {
  id: string;
  _id?: string;
  serviceId?: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreateServiceTypeRequest {
  serviceId: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number;
}

export interface UpdateServiceTypeRequest {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
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
