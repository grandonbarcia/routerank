'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Validation schemas
const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    fullName: z.string().min(1, 'Full name is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function signUp(formData: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}) {
  try {
    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || 'Validation failed';
      return {
        error: firstError,
      };
    }

    const supabase = await createClient();

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          full_name: result.data.fullName,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Sign up successful! Please check your email to confirm.',
      user: data.user,
    };
  } catch {
    return {
      error: 'An unexpected error occurred',
    };
  }
}

export async function signIn(formData: { email: string; password: string }) {
  try {
    const result = signInSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || 'Validation failed';
      return {
        error: firstError,
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      return {
        error: error.message,
      };
    }

    // Redirect to dashboard on successful login
    redirect('/dashboard');
  } catch {
    return {
      error: 'An unexpected error occurred',
    };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  } catch {
    return {
      error: 'Failed to sign out',
    };
  }
}

export async function resetPassword(formData: { email: string }) {
  try {
    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message || 'Validation failed';
      return {
        error: firstError,
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(
      result.data.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
      }
    );

    if (error) {
      return {
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  } catch {
    return {
      error: 'An unexpected error occurred',
    };
  }
}

export async function updateProfile(data: {
  fullName?: string;
  avatarUrl?: string;
}) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        avatar_url: data.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      return {
        error: error.message,
      };
    }

    return {
      success: true,
      message: 'Profile updated successfully',
    };
  } catch {
    return {
      error: 'An unexpected error occurred',
    };
  }
}
