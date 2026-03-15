// types/index.ts

export interface Image {
  id: string;
  url: string;
  publicId: string;
  altText?: string;
  isPrimary: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  role: "user" | "host" | "admin";
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  pricePerNight: number;
  amenities: string[];
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };
  isAvailable: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  host: User;
  hostId: string;
  images: Image[];
  averageRating: number;
  totalReviews: number;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  user: User;
  userId: string;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  user: User;
  userId: string;
  property: Property;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  pricePerDay: number;
  description: string;
  features: string[];
  images: { url: string; publicId: string }[];
  isAvailable: boolean;
  location?: string;
  seats: number;
  withDriver: boolean;
  averageRating: number;
  totalReviews: number;
  host: User;
  hostId: string;
  createdAt: string;
  updatedAt: string;
}

// API response shapes
export interface ApiResponse<T> {
  status: "success" | "fail" | "error";
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  results: number;
  page: number;
  totalPages: number;
}

// Auth types
export interface AuthUser extends User {}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "user" | "host";
}

// Search / filter types
export interface PropertyFilters {
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  maxGuests?: number;
  propertyType?: string;
  startDate?: string;
  endDate?: string;
}
