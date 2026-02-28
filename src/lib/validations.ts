import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const serviceRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  serviceType: z.enum(["CONSULTING", "TRAINING", "SPEAKING", "AI_DEVELOPMENT", "OTHER"]),
  description: z.string().min(20, "Please provide more details"),
  budget: z.string().optional(),
});

export const questionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  content: z.string().min(20, "Question must be at least 20 characters"),
});

export const commentSchema = z.object({
  content: z.string().min(2, "Comment cannot be empty"),
});

export const blogPostSchema = z.object({
  title: z.string().min(3, "Title is required"),
  titleFr: z.string().optional(),
  content: z.string().min(50, "Content must be at least 50 characters"),
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
  year: z.number().int().min(2000).max(2030),
  category: z.string().optional(),
  pdfUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
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
