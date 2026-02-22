import { supabase } from '../config/supabase.js';

export async function registerUser(email, password) {
  if (!supabase) {
    throw new Error('Authentication service not configured');
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw error;

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) throw signInError;

  return {
    user: { id: data.user.id, email: data.user.email },
    token: signInData.session.access_token,
  };
}

export async function loginUser(email, password) {
  if (!supabase) {
    throw new Error('Authentication service not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return {
    user: { id: data.user.id, email: data.user.email },
    token: data.session.access_token,
  };
}
