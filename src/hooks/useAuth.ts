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
    // مراقبة تغييرات حالة المصادقة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      // إذا انتهت الجلسة أو حدث خطأ في التحديث (Refresh Token Error)
      if (event === 'SIGNED_OUT' || !session) {
        reset();
        setLoading(false);
        // التوجيه للوجين فقط إذا لم نكن في صفحات عامة
        if (window.location.pathname.includes('/dashboard') || window.location.pathname.includes('/account')) {
            navigate('/login');
        }
        return;
      }

      if (session?.user) {
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();

          if (profile) setUserProfile(profile);
          if (roleData) setCurrentRole(roleData.role as UserRole);
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      setLoading(false);
    });

    // تحقق أولي من الجلسة عند فتح التطبيق
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            // إذا وجد خطأ في الجلسة (مثل خطأ Refresh Token)، امسح كل شيء
            await supabase.auth.signOut();
            reset();
        }
      } catch (err) {
        reset();
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    reset();
    navigate('/login');
  };

  return { userProfile, loading, logout, isAuthenticated: !!userProfile };
}
