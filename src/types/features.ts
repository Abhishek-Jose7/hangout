// ============================================================================
// Type definitions for all new features
// ============================================================================

// ============================================================================
// EXPENSE SPLITTING TYPES
// ============================================================================

export type ExpenseCategory = 'food' | 'transport' | 'entertainment' | 'accommodation' | 'shopping' | 'other';
export type SplitType = 'equal' | 'custom' | 'percentage';
export type SettlementStatus = 'pending' | 'completed' | 'cancelled';

export interface Expense {
  id: string;
  groupId: string;
  paidById: string;
  paidBy?: Member;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
  splits?: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  memberId: string;
  member?: Member;
  amount: number;
  percentage: number;
  isPaid: boolean;
  created_at: string;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  fromMember?: Member;
  toMemberId: string;
  toMember?: Member;
  amount: number;
  status: SettlementStatus;
  notes?: string;
  created_at: string;
  settled_at?: string;
}

export interface MemberBalance {
  memberId: string;
  member: Member;
  totalPaid: number;
  totalOwed: number;
  balance: number; // positive = owed money, negative = owes money
}

export interface SimplifiedDebt {
  from: Member;
  to: Member;
  amount: number;
}

// ============================================================================
// RANKED CHOICE VOTING TYPES
// ============================================================================

export interface RankedVote {
  id: string;
  groupId: string;
  memberId: string;
  member?: Member;
  itineraryIdx: number;
  rank: number; // 1 = first choice, 2 = second choice, etc.
  created_at: string;
  updated_at: string;
}

export interface RankedVotingResult {
  itineraryIdx: number;
  totalPoints: number;
  firstChoiceVotes: number;
  secondChoiceVotes: number;
  thirdChoiceVotes: number;
  voters: string[];
}

// ============================================================================
// TIME SLOT VOTING TYPES
// ============================================================================

export type TimeAvailability = 'yes' | 'maybe' | 'no';
export type RecurringPattern = 'weekly' | 'biweekly' | 'monthly';

export interface TimeSlot {
  id: string;
  groupId: string;
  proposedById: string;
  proposedBy?: Member;
  startTime: string;
  endTime: string;
  title?: string;
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  created_at: string;
  votes?: TimeSlotVote[];
}

export interface TimeSlotVote {
  id: string;
  timeSlotId: string;
  memberId: string;
  member?: Member;
  availability: TimeAvailability;
  created_at: string;
  updated_at: string;
}

export interface TimeSlotSummary {
  timeSlot: TimeSlot;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  totalResponses: number;
  score: number; // yes = 2, maybe = 1, no = 0
}

// ============================================================================
// REVIEW & HISTORY TYPES
// ============================================================================

export type HangoutStatus = 'planned' | 'ongoing' | 'completed' | 'cancelled';

export interface Hangout {
  id: string;
  groupId: string;
  group?: Group;
  title: string;
  description?: string;
  selectedItineraryIdx?: number;
  itineraryData?: Location;
  totalSpent: number;
  startDate?: string;
  endDate?: string;
  status: HangoutStatus;
  created_at: string;
  updated_at: string;
  reviews?: HangoutReview[];
  placeReviews?: PlaceReview[];
}

export interface HangoutReview {
  id: string;
  hangoutId: string;
  memberId: string;
  member?: Member;
  rating: number; // 1-5
  feedback?: string;
  wouldRepeat: boolean;
  highlights: string[];
  improvements: string[];
  created_at: string;
}

export interface PlaceReview {
  id: string;
  hangoutId: string;
  memberId: string;
  member?: Member;
  placeId: string;
  placeName: string;
  rating: number; // 1-5
  review?: string;
  photos: string[];
  created_at: string;
}

export interface HangoutStats {
  totalHangouts: number;
  completedHangouts: number;
  totalSpent: number;
  averageRating: number;
  favoriteCategories: string[];
  topPlaces: { placeId: string; placeName: string; avgRating: number; visitCount: number }[];
}

// ============================================================================
// SOCIAL FEATURES TYPES
// ============================================================================

export type FriendStatus = 'pending' | 'accepted' | 'blocked';
export type InvitationMethod = 'email' | 'whatsapp' | 'link' | 'in-app';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';
export type GroupStatus = 'active' | 'planning' | 'completed' | 'archived';

export interface Friend {
  id: string;
  userId: string;
  friendUserId: string;
  friendUser?: {
    id: string;
    name: string;
    email?: string;
    imageUrl?: string;
  };
  status: FriendStatus;
  created_at: string;
  accepted_at?: string;
}

export interface Invitation {
  id: string;
  groupId: string;
  group?: Group;
  invitedById: string;
  invitedBy?: Member;
  invitedEmail?: string;
  invitedPhone?: string;
  invitedUserId?: string;
  method: InvitationMethod;
  status: InvitationStatus;
  expiresAt?: string;
  created_at: string;
}

// ============================================================================
// TRANSPORTATION TYPES
// ============================================================================

export interface TravelTime {
  memberId: string;
  memberName: string;
  memberLocation: string;
  destination: string;
  drivingTime?: number; // in minutes
  drivingDistance?: number; // in km
  transitTime?: number;
  walkingTime?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface TransportationSummary {
  placeId: string;
  placeName: string;
  memberTravelTimes: TravelTime[];
  averageTravelTime: number;
  maxTravelTime: number;
  minTravelTime: number;
}

// ============================================================================
// BUDGET TRACKING TYPES
// ============================================================================

export interface BudgetSummary {
  groupId: string;
  totalBudget: number;
  totalEstimated: number;
  totalActual: number;
  remainingBudget: number;
  budgetUtilization: number; // percentage
  perPersonBudget: {
    memberId: string;
    memberName: string;
    budget: number;
    spent: number;
    remaining: number;
  }[];
  categoryBreakdown: {
    category: ExpenseCategory;
    estimated: number;
    actual: number;
    percentage: number;
  }[];
  historicalComparison?: {
    month: string;
    avgSpent: number;
    hangoutCount: number;
  }[];
}

// ============================================================================
// EXTENDED EXISTING TYPES
// ============================================================================

export interface Member {
  id: string;
  name: string;
  location: string;
  budget: number;
  mood_tags: string;
  clerkUserId: string;
  email?: string;
  is_admin?: boolean;
  groupId: string;
  created_at?: string;
}

export interface Group {
  id: string;
  code: string;
  name?: string;
  description?: string;
  isPublic: boolean;
  maxMembers: number;
  status: GroupStatus;
  selectedTimeSlotId?: string;
  finalItineraryIdx?: number;
  totalBudget?: number;
  actualSpent: number;
  created_at: string;
  updated_at: string;
  Member?: Member[];
}

export interface ItineraryDetail {
  address: string;
  rating: number | null;
  photos: string[];
  priceLevel: number | null;
  name: string;
  placeId: string;
  mapsLink: string;
  reviews: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  userRatingsTotal: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Location {
  name: string;
  description: string;
  itinerary: string[];
  estimatedCost: number;
  itineraryDetails?: ItineraryDetail[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateExpenseRequest {
  groupId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  splitType: SplitType;
  splits?: { memberId: string; amount?: number; percentage?: number }[];
  receipt_url?: string;
}

export interface RankedVoteRequest {
  groupId: string;
  votes: { itineraryIdx: number; rank: number }[];
}

export interface TimeSlotRequest {
  groupId: string;
  startTime: string;
  endTime: string;
  title?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

export interface TimeSlotVoteRequest {
  timeSlotId: string;
  availability: TimeAvailability;
}

export interface HangoutReviewRequest {
  hangoutId: string;
  rating: number;
  feedback?: string;
  wouldRepeat: boolean;
  highlights?: string[];
  improvements?: string[];
}

export interface InvitationRequest {
  groupId: string;
  method: InvitationMethod;
  invitedEmail?: string;
  invitedPhone?: string;
  invitedUserId?: string;
}

export interface FriendRequest {
  friendUserId: string;
}
