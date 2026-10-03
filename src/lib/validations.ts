import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message is too long"),
});

export const serviceRequestSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  serviceType: z.enum(["CONSULTING", "TRAINING", "SPEAKING", "AI_DEVELOPMENT", "OTHER"]),
  description: z.string().min(20, "Please provide more details").max(5000),
  budget: z.string().optional(),
});

export const questionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  content: z.string().min(20, "Question must be at least 20 characters").max(10000, "Question is too long"),
});

export const commentSchema = z.object({
  content: z.string().min(2, "Comment cannot be empty").max(5000, "Comment is too long"),
});

export const blogPostSchema = z.object({
  title: z.string().min(3, "Title is required").max(200),
  titleFr: z.string().optional(),
  content: z.string().min(50, "Content must be at least 50 characters").max(100000),
  contentFr: z.string().optional(),
  excerpt: z.string().optional(),
  excerptFr: z.string().optional(),
  coverImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ServiceRequestInput = z.infer<typeof serviceRequestSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export const publicationSchema = z.object({
  title: z.string().min(3, "Title is required"),
  titleFr: z.string().optional(),
  abstract: z.string().min(20, "Abstract must be at least 20 characters"),
  abstractFr: z.string().optional(),
  authors: z.array(z.string()).min(1, "At least one author is required"),
  journal: z.string().optional(),
  year: z.number().int().min(1990).max(2040),
  category: z.string().optional(),
  pdfUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  publicationType: z.enum([
    "JOURNAL_ARTICLE", "CONFERENCE_PAPER", "WORKING_PAPER",
    "THESIS_DISSERTATION", "BOOK_CHAPTER", "TECHNICAL_REPORT",
    "PREPRINT", "ANALYTICAL_REPORT",
  ]).optional(),
  doi: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  publisher: z.string().optional(),
  publisherFr: z.string().optional(),
  conferenceName: z.string().optional(),
  conferenceNameFr: z.string().optional(),
  conferenceLocation: z.string().optional(),
  bookTitle: z.string().optional(),
  bookTitleFr: z.string().optional(),
  institution: z.string().optional(),
  institutionFr: z.string().optional(),
  month: z.number().int().min(1).max(12).optional(),
  url: z.string().optional(),
  citationCount: z.number().int().min(0).optional(),
  accessLevel: z.enum(["FREE", "GATED"]).optional(),
  dataUrl: z.string().optional(),
  supplementaryUrl: z.string().optional(),
});

export const researchActivitySchema = z.object({
  type: z.enum([
    "RESEARCH_PAPER", "JOURNAL_ARTICLE", "CONFERENCE_PAPER", "WORKING_PAPER",
    "TECHNICAL_REPORT", "BOOK_CHAPTER", "DATASET_RELEASE",
    "CONFERENCE_ATTENDED", "TALK_GIVEN", "PEER_REVIEW",
    "GRANT_RECEIVED", "MILESTONE", "WORKSHOP", "AWARD",
    "TEACHING", "SUPERVISION", "COLLABORATION", "PATENT", "SOFTWARE_RELEASE", "OTHER",
  ]),
  title: z.string().min(3, "Title is required"),
  titleFr: z.string().optional(),
  description: z.string().optional(),
  descriptionFr: z.string().optional(),
  authors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  date: z.string().min(1, "Date is required"),
  location: z.string().optional(),
  locationFr: z.string().optional(),
  url: z.string().optional(),
  paperUrl: z.string().optional(),
  dataUrl: z.string().optional(),
  supplementaryUrl: z.string().optional(),
  accessLevel: z.enum(["FREE", "GATED"]).optional(),
  published: z.boolean().optional(),
});

export const experienceSchema = z.object({
  role: z.string().min(2),
  roleFr: z.string().optional(),
  organization: z.string().min(2),
  location: z.string().min(2),
  startDate: z.string().min(4),
  endDate: z.string().nullable().optional(),
  description: z.array(z.string()),
  descriptionFr: z.array(z.string()).optional(),
  logo: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const projectSchema = z.object({
  title: z.string().min(3),
  titleFr: z.string().optional(),
  description: z.string().min(10),
  descriptionFr: z.string().optional(),
  coverImage: z.string().optional(),
  technologies: z.array(z.string()),
  category: z.string().optional(),
  liveUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const educationSchema = z.object({
  degree: z.string().min(3),
  degreeFr: z.string().optional(),
  institution: z.string().min(2),
  year: z.string().min(4),
  location: z.string().min(2),
  sortOrder: z.number().int().optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(3),
  issuer: z.string().min(2),
  year: z.string().min(4),
  sortOrder: z.number().int().optional(),
});

export const skillCategorySchema = z.object({
  name: z.string().min(2),
  nameFr: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(0).max(100),
  categoryId: z.string(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type PublicationInput = z.infer<typeof publicationSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type SkillCategoryInput = z.infer<typeof skillCategorySchema>;
export type SkillInput = z.infer<typeof skillSchema>;
export type ResearchActivityInput = z.infer<typeof researchActivitySchema>;

export const subscriptionRequestSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  organization: z.string().optional(),
  tier: z.enum(["DOCUMENT_ACCESS", "DATA_ACCESS", "FULL_ACCESS"]),
  billing: z.enum(["monthly", "yearly"]),
  message: z.string().max(2000).optional(),
});

export type SubscriptionRequestInput = z.infer<typeof subscriptionRequestSchema>;

// --------------------------------------------------------------------------
// Bookstore
// --------------------------------------------------------------------------

export const bookSchema = z.object({
  kind: z.enum(["BOOK", "REPORT", "DATASET", "TEMPLATE", "TOOLKIT", "COURSE"]).optional(),
  title: z.string().min(2, "Title is required").max(300),
  titleFr: z.string().max(300).optional().or(z.literal("")),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  subtitleFr: z.string().max(300).optional().or(z.literal("")),
  description: z.string().min(10, "Description must be at least 10 characters").max(20000),
  descriptionFr: z.string().max(20000).optional().or(z.literal("")),
  keyInsights: z.array(z.string().max(500)).max(20).optional(),
  keyInsightsFr: z.array(z.string().max(500)).max(20).optional(),
  author: z.string().max(200).optional(),
  publicationYear: z.number().int().min(1900).max(2100),
  isbn: z.string().max(32).optional().or(z.literal("")),
  language: z.string().max(60).optional().or(z.literal("")),
  pageCount: z.number().int().min(0).max(100000).optional(),
  category: z.string().max(120).optional().or(z.literal("")),
  tags: z.array(z.string().max(60)).max(30).optional(),
  priceCents: z.number().int().min(0, "Price cannot be negative").max(100000000),
  currency: z.string().length(3).optional(),
  // Launch offer (must undercut the price) and pay-what-you-want.
  salePriceCents: z.number().int().min(0).max(100000000).nullable().optional(),
  saleStartsAt: z.string().datetime().nullable().optional().or(z.literal("")),
  saleEndsAt: z.string().datetime().nullable().optional().or(z.literal("")),
  payWhatYouWant: z.boolean().optional(),
  coverImageId: z.string().max(200).optional().or(z.literal("")),
  fileId: z.string().max(200).optional().or(z.literal("")),
  fileName: z.string().max(300).optional().or(z.literal("")),
  fileMimeType: z.string().max(200).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})
  .refine((b) => b.salePriceCents == null || b.salePriceCents < b.priceCents, {
    message: "The launch price must be lower than the regular price",
    path: ["salePriceCents"],
  })
  .refine((b) => !b.saleStartsAt || !b.saleEndsAt || new Date(b.saleEndsAt) > new Date(b.saleStartsAt), {
    message: "The offer must end after it starts",
    path: ["saleEndsAt"],
  });

const cartItemsSchema = z
  .array(
    z.object({
      bookId: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(99),
      /** Pay-what-you-want amount; validated against the minimum server-side. */
      amountCents: z.number().int().min(0).max(100_000_000).optional(),
    })
  )
  .min(1, "Your cart is empty")
  .max(50);

export const checkoutSchema = z.object({
  email: z.string().email("A valid email is required").max(320),
  name: z.string().max(200).optional().or(z.literal("")),
  items: cartItemsSchema,
});

export const freeOrderSchema = z.object({
  email: z.string().email("A valid email is required").max(320),
  name: z.string().max(200).optional().or(z.literal("")),
  items: cartItemsSchema,
});

/**
 * Manually-settled orders: the buyer pays the merchant directly and an admin
 * confirms it. Covers mobile money and the "PayPal to PayPal" direct transfer,
 * which needs no REST credentials.
 */
export const manualOrderSchema = z.object({
  email: z.string().email("A valid email is required").max(320),
  name: z.string().max(200).optional().or(z.literal("")),
  provider: z.enum(["WAVE", "DJAMO", "ORANGE_MONEY", "PAYPAL"]),
  // Optional — the buyer sends proof of payment to the merchant after the invoice.
  reference: z.string().max(120).optional().or(z.literal("")),
  items: cartItemsSchema,
});


export const couponSchema = z
  .object({
    code: z.string().min(2, "Code must be at least 2 characters").max(40),
    type: z.enum(["PERCENT", "FIXED"]),
    percentOff: z.number().int().min(1).max(100).optional(),
    amountOff: z.number().min(0).optional(), // major units (converted to cents by currency)
    currency: z.string().length(3).optional().or(z.literal("")),
    minSubtotal: z.number().min(0).optional(), // major units
    maxRedemptions: z.number().int().min(1).nullable().optional(),
    active: z.boolean().optional(),
    expiresAt: z.string().nullable().optional(),
  })
  .refine((d) => d.type !== "PERCENT" || (d.percentOff != null && d.percentOff >= 1), {
    message: "Percentage coupons need a percent (1-100)",
    path: ["percentOff"],
  })
  .refine((d) => d.type !== "FIXED" || (d.amountOff != null && d.amountOff > 0), {
    message: "Fixed coupons need an amount",
    path: ["amountOff"],
  })
  .refine((d) => d.type !== "FIXED" || (!!d.currency && d.currency.length === 3), {
    message: "Fixed coupons need a currency",
    path: ["currency"],
  });

export type BookInput = z.infer<typeof bookSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ManualOrderInput = z.infer<typeof manualOrderSchema>;
export type FreeOrderInput = z.infer<typeof freeOrderSchema>;
export type CouponInput = z.infer<typeof couponSchema>;

// ── Consulting bookings ──────────────────────────────────────────────────────

const httpsUrl = z
  .string()
  .max(500)
  .url()
  .refine((u) => u.startsWith("https://"), "Must be an https:// link");

export const adminBookingUpdateSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]).optional(),
  meetingUrl: httpsUrl.optional().or(z.literal("")),
  /** Reschedule to this start (keeps the package duration). */
  startsAt: z.string().datetime().optional(),
});

export const bookingRequestSchema = z.object({
  packageSlug: z.string().min(1).max(120),
  startsAt: z.string().datetime(),
  name: z.string().trim().min(2, "Please enter your name").max(200),
  email: z.string().email("A valid email is required").max(320),
  company: z.string().max(200).optional().or(z.literal("")),
  notes: z.string().max(4000).optional().or(z.literal("")),
  timezone: z.string().max(64).optional(),
  locale: z.enum(["en", "fr"]).optional(),
  /** FREE only for zero-price packages (enforced server-side). */
  payment: z.enum(["PAYPAL", "MANUAL", "FREE"]),
  provider: z.enum(["WAVE", "DJAMO", "ORANGE_MONEY", "PAYPAL"]).optional(),
  reference: z.string().max(120).optional().or(z.literal("")),
});

export const servicePackageSchema = z.object({
  title: z.string().trim().min(2).max(200),
  titleFr: z.string().max(200).optional().or(z.literal("")),
  description: z.string().trim().min(2).max(4000),
  descriptionFr: z.string().max(4000).optional().or(z.literal("")),
  durationMinutes: z.number().int().min(15).max(480),
  priceCents: z.number().int().min(0).max(100_000_00),
  currency: z.string().regex(/^[A-Z]{3}$/),
  active: z.boolean(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

export const availabilitySchema = z.object({
  rules: z
    .array(
      z
        .object({
          weekday: z.number().int().min(0).max(6),
          startMinute: z.number().int().min(0).max(1440),
          endMinute: z.number().int().min(0).max(1440),
        })
        .refine((r) => r.endMinute > r.startMinute, "End must be after start")
    )
    .max(50),
  settings: z.object({
    timeZone: z.string().min(1).max(64),
    minNoticeHours: z.number().int().min(0).max(720),
    windowDays: z.number().int().min(1).max(180),
    bufferMinutes: z.number().int().min(0).max(240),
    slotStepMinutes: z.number().int().min(5).max(240),
    manualHoldHours: z.number().int().min(1).max(336),
    // https only: it is rendered as a link to clients.
    meetingUrl: httpsUrl.optional().or(z.literal("")),
  }),
});

export const blockedPeriodSchema = z
  .object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    reason: z.string().max(200).optional().or(z.literal("")),
  })
  .refine((b) => new Date(b.endsAt) > new Date(b.startsAt), "End must be after start");

// ── Quotes ───────────────────────────────────────────────────────────────────

export const quoteInputSchema = z.object({
  clientName: z.string().trim().min(2).max(200),
  clientEmail: z.string().email().max(320),
  company: z.string().max(200).optional().or(z.literal("")),
  title: z.string().trim().min(2).max(200),
  scope: z.string().trim().min(2).max(20000),
  items: z
    .array(z.object({ description: z.string().trim().min(1).max(500), amountCents: z.number().int().min(0).max(10_000_000_000) }))
    .min(1)
    .max(50),
  currency: z.string().regex(/^[A-Z]{3}$/),
  depositPercent: z.number().int().min(0).max(100),
  validUntil: z.string().datetime().optional().or(z.literal("")),
  locale: z.enum(["en", "fr"]),
  internalNotes: z.string().max(5000).optional().or(z.literal("")),
  serviceRequestId: z.string().max(40).optional().or(z.literal("")),
});

export const quoteAcceptSchema = z.object({
  name: z.string().trim().min(2, "Type your full name to accept").max(200),
  agree: z.literal(true),
});

export const quoteDeclineSchema = z.object({
  reason: z.string().max(2000).optional().or(z.literal("")),
});

export const quotePaySchema = z.object({
  payment: z.enum(["PAYPAL", "MANUAL"]),
  provider: z.enum(["WAVE", "DJAMO", "ORANGE_MONEY", "PAYPAL"]).optional(),
  reference: z.string().max(120).optional().or(z.literal("")),
});

// ── Bundles ──────────────────────────────────────────────────────────────────

export const bundleSchema = z.object({
  title: z.string().trim().min(2).max(300),
  titleFr: z.string().max(300).optional().or(z.literal("")),
  description: z.string().trim().min(10).max(20000),
  descriptionFr: z.string().max(20000).optional().or(z.literal("")),
  priceCents: z.number().int().min(1, "A bundle needs a price").max(100000000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  bookIds: z.array(z.string().min(1).max(40)).min(2, "Pick at least two products").max(50),
  coverImageId: z.string().max(200).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
});

// ── Affiliates ───────────────────────────────────────────────────────────────

export const affiliateApplySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().email("A valid email is required").max(320),
  website: z.string().max(300).optional().or(z.literal("")),
  pitch: z.string().trim().min(10, "Tell me briefly how you'll share the books").max(2000),
  payoutMethod: z.enum(["PAYPAL", "WAVE", "DJAMO", "ORANGE_MONEY"]),
  payoutDetails: z.string().trim().min(3, "Where should commissions be paid?").max(200),
  locale: z.enum(["en", "fr"]).optional(),
  agree: z.literal(true),
});

export const affiliateAdminUpdateSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "SUSPENDED", "REJECTED"]).optional(),
  commissionPercent: z.number().int().min(1).max(90).optional(),
});

export const commissionActionSchema = z.object({
  action: z.enum(["approve", "pay", "void"]),
  ids: z.array(z.string().min(1).max(40)).min(1).max(500),
  note: z.string().max(300).optional().or(z.literal("")),
});

export const affiliateSettingsSchema = z.object({
  defaultPercent: z.number().int().min(1).max(90),
  cookieDays: z.number().int().min(1).max(365),
  holdDays: z.number().int().min(0).max(120),
});
