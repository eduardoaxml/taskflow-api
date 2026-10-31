import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: z.string().trim().max(150, "First name is too long."),
    last_name: z.string().trim().max(150, "Last name is too long."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  first_name: z.string().trim().max(150, "First name is too long."),
  last_name: z.string().trim().max(150, "Last name is too long."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required."),
    new_password: z
      .string()
      .min(12, "Password must be at least 12 characters long."),
    confirm_password: z.string().min(1, "Please confirm your new password."),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  })
  .refine((values) => values.current_password !== values.new_password, {
    message: "Your new password must be different from your current password.",
    path: ["new_password"],
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;
