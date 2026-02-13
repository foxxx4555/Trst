import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, FileText, Camera, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

// تعريف أنواع البيانات بشكل دقيق
interface DocumentType {
  id: 'license' | 'truck_photo';
  label: string;
  icon: React.ReactNode;
  allowedTypes: string[];
  maxSize: number;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  license_url?: string;
  truck_photo_url?: string;
}

export default function DriverAccount() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({
    license: false,
    truck_photo: false,
  });
  const [docsStatus, setDocsStatus] = useState<Record<string, boolean>>({
    license: false,
    truck_photo: false,
  });

  // تحميل حالة الوثائق عند بدء التشغيل
  useEffect(() => {
    if (!userProfile) return;
    setDocsStatus({
      license: !!userProfile.license_url,
      truck_photo: !!userProfile.truck_photo_url,
    });
  }, [userProfile]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'truck_photo') => {
    const file = e.target.files?.[0];
    if (!file || !userProfile) return;

    // التحقق من نوع وحجم الملف
    const docType = documentTypes.find(d => d.id === type);
    if (!docType?.allowedTypes.includes(file.type) || file.size > docType.maxSize) {
      toast.error(t('invalid_file', { type: docType?.label }));
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const fileName = `${userProfile.id}_${type}_${Date.now()}.${file.name.split('.').pop()}`;
      const url = await api.uploadFile(fileName, file);
      await api.updateProfile(userProfile.id, { [`${type}_url`]: url });
      setDocsStatus(prev => ({ ...prev, [type]: true }));
      toast.success(t('upload_success', { type: docType?.label }));
    } catch (error) {
      toast.error(t('upload_failed'));
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // حالة عدم وجود مستخدم
  if (!userProfile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <AlertCircle size={40} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold text-slate-800">{t('profile_not_found')}</h3>
          <p className="text-slate-500">{t('login_required')}</p>
        </div>
      </AppLayout>
    );
  }

  const documentTypes: DocumentType[] = [
    {
      id: 'license',
      label: t('driving_license'),
      icon: <FileText className="text-blue-600" />,
      allowedTypes: ['image/jpeg', 'image/png'],
      maxSize: 5 * 1024 * 1024,
    },
    {
      id: 'truck_photo',
      label: t('truck_photo'),
      icon: <Camera className="text-emerald-600" />,
      allowedTypes: ['image/jpeg', 'image/png'],
      maxSize: 8 * 1024 * 1024,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 p-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8">
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <User size={24} className="text-blue-500" /> {t('driver_profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">{t('full_name')}</Label>
                <Input value={userProfile.full_name} readOnly className="h-14 rounded-2xl bg-slate-50 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">{t('phone')}</Label>
                <Input value={userProfile.phone} readOnly dir="ltr" className="h-14 rounded-2xl bg-slate-50 font-bold" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <FileText className="text-blue-600" /> {t('required_documents')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {documentTypes.map(doc => (
                  <div key={doc.id} className="space-y-3">
                    <div className={`flex items-center gap-2 font-bold text-slate-700`}>
                      {doc.icon} {doc.label}
                      {docsStatus[doc.id] && <CheckCircle className="text-green-500 ml-2" />}
                    </div>
                    <label 
                      htmlFor={doc.id}
                      className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl transition-all cursor-pointer
                        ${docsStatus[doc.id] ? 'border-green-500 bg-green-50' : 'border-dashed border-slate-300 hover:border-blue-500'}
                      `}
                    >
                      {loading[doc.id] ? (
                        <Loader2 className="animate-spin text-primary" size={24} />
                      ) : docsStatus[doc.id] ? (
                        <div className="text-center">
                          <CheckCircle size={32} className="mx-auto text-green-500 mb-2" />
                          <p className="font-bold text-green-600">{t('document_uploaded')}</p>
                          <Button variant="secondary" size="sm" onClick={() => window.open(userProfile[`${doc.id}_url`])}>
                            <Eye size={16} className="mr-2" /> {t('view_document')}
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          {doc.icon}
                          <p className="mt-3 font-bold text-slate-700">{doc.label}</p>
                          <p className="text-xs text-slate-500">{t('click_to_upload')}</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id={doc.id} 
                        className="hidden" 
                        onChange={(e) => handleUpload(e, doc.id)}
                        accept={doc.allowedTypes.join(',')}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
