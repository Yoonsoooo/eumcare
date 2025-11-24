import { supabase } from "./supabase";

export async function signUp(email: string, password: string, name: string) {
  // Note: Since we're using admin.createUser on the server, we'll handle this through API
  return { error: "Please use the signup through server API" };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Sign in error:", error);
    return { session: null, error };
  }

  return { session: data.session, error: null };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Sign out error:", error);
  }
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Get session error:", error);
    return { session: null, error };
  }
  return { session: data.session, error: null };
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) {
    console.error("Get user error:", error);
    return { user: null, error };
  }
  return { user, error: null };
}

export { supabase };
