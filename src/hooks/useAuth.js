import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useAuth — gestion session Supabase Auth
 * - user     : l'objet auth.user (ou null)
 * - profile  : l'entrée dans la table profiles (ou null)
 * - loading  : true pendant la récupération initiale
 * - needsProfile : true si user connecté mais pas encore de profil
 */
export function useAuth() {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Récupère le profil depuis la table profiles */
  const fetchProfile = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') console.error('fetchProfile:', error);
    setProfile(data || null);
  }, []);

  /* Écoute les changements de session */
  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Écoute les changements (magic link callback, logout…)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  /* Envoyer le magic link */
  const signInWithEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  /* Créer le profil (après premier login) */
  const createProfile = useCallback(async ({ username, avatarEmoji, avatarColor }) => {
    if (!user) throw new Error('Non connecté');
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username,
        avatar_emoji: avatarEmoji,
        avatar_color: avatarColor,
      })
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [user]);

  /* Mettre à jour le profil */
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

  /* Se déconnecter */
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
    createProfile,
    updateProfile,
    signOut,
  };
}
