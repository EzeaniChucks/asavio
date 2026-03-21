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
  bankAccountNumber?: string;
  bankCode?: string;
  bankAccountName?: string;
  bankName?: string;
  paystackRecipientCode?: string;
  commissionRateOverride?: number | null;
  kycStatus?: "not_submitted" | "pending" | "approved" | "rejected";
  kycDocumentType?: string | null;
  kycSubmittedAt?: string | null;
  kycReviewedAt?: string | null;
  kycRejectionReason?: string | null;
  hostTier?: "new_host" | "trusted_host" | "top_host";
  responseRate?: number;
  lastSeen?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "message"
  | "booking_request"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "review_received"
  | "kyc_approved"
  | "kyc_rejected"
  | "listing_approved"
  | "listing_rejected"
  | "payout_transferred";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  guestId: string;
  guest?: User;
  hostId: string;
  host?: User;
  propertyId: string | null;
  property?: Property | null;
  vehicleId: string | null;
  vehicle?: Vehicle | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
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
  purposePricing?: Record<string, number> | null;
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
  propertyId?: string;
  vehicleId?: string;
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
  platformCommission: number;
  hostPayout: number;
  appliedCommissionRate?: number | null;
  /** ISO 4217 currency code — defaults to "NGN". Use with formatPrice(). */
  currency?: string;
  purpose?: string;
  status: "awaiting_payment" | "confirmed" | "cancelled" | "completed";
  paymentMethod: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  hostPayoutStatus: "pending" | "processing" | "transferred" | "failed";
  paystackReference?: string;
  payoutReference?: string;
  paymentNotes?: string;
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
  priceWithDriverPerDay?: number | null;
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
