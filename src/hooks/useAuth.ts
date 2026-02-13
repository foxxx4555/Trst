import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/appStore';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';

export function useAuth() {
  const { userProfile, setUserProfile, setCurrentRole, reset } = useAppStore();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        reset();
        setLoading(false);
        return;
      }

      if (session?.user) {
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();

          // حتى لو لم يجد بروفايل (بسبب المسح)، نضع بيانات افتراضية لكي يفتح التطبيق
          setUserProfile(profile || { id: session.user.id, full_name: 'مستخدم جديد' });
          setCurrentRole((roleData?.role as UserRole) || 'shipper');
        } catch (e) {
          console.error("Auth fetch error", e);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/login');
  };

  return { userProfile, currentRole: useAppStore.getState().currentRole, loading, logout, isAuthenticated: !!userProfile };
}
