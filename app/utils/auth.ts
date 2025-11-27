import { createClient } from "@supabase/supabase-js";

// 1. 환경변수에서 주소와 키를 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 2. Supabase 클라이언트를 여기서 바로 생성합니다.
export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 아래 함수들은 그대로 유지됩니다 ---

export async function signUp(email: string, password: string, name: string) {
  // 클라이언트 사이드 회원가입 처리
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  });

  if (error) {
    console.error("Sign up error:", error);
    return { error: error.message };
  }

  return { data, error: null };
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
