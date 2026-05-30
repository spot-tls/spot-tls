import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') console.error('fetchProfile:', error);
    setProfile(data || null);
    return data || null;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signInWithEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const createProfile = useCallback(async ({ username, quartier, moods, birthYear, avatarUrl }) => {
    if (!user) throw new Error('Non connecté');
    // Récupère l'avatar depuis Google si dispo
    const googleAvatar = user.user_metadata?.avatar_url || null;
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        full_name:   user.user_metadata?.full_name || null,
        avatar_url:  avatarUrl || googleAvatar || null,
        quartier:    quartier || null,
        fav_moods:   moods || [],
        birth_year:  birthYear || null,
      })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error('Non connecté');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return {
    user,
    profile,
    loading,
    needsProfile: !!user && !profile,
    isLoggedIn: !!user && !!profile,
    signInWithEmail,
    signInWithGoogle,
    createProfile,
    updateProfile,
    signOut,
  };
}
