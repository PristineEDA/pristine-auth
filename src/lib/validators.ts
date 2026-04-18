import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少 6 个字符"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(2, "用户名至少 2 个字符")
      .max(30, "用户名最多 30 个字符"),
    email: z.email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少 6 个字符"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const verifyOtpSchema = z.object({
  email: z.email(),
  token: z.string().length(6, "验证码为 6 位数字"),
});

export const settingsSchema = z.object({
  config_data: z.record(z.string(), z.unknown()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
