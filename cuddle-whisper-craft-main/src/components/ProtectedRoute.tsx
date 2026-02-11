import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  // 1. طول ما هو بيحمل، اعرض شاشة تحميل (عشان ما يعملش ريفرش ويرميك بره)
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // 2. لو خلص تحميل ومفيش مستخدم، وديه لصفحة الدخول
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. لو مسجل دخول، اعرض الصفحة المطلوبة (نفس الصفحة اللي هو فيها)
  return <Outlet />;
}
