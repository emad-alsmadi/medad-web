import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Helmet } from 'react-helmet-async';
import { useMe } from '@/hooks/users/use-me';
import { useSetMyReportInfo } from '@/hooks/users/use-set-report-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';
import type { ReportInfo } from '@/types/user';

const ROLE_LABELS: Record<'ADMIN' | 'USER', string> = {
  ADMIN: 'مسؤول',
  USER: 'مستخدم',
};

const reportInfoSchema = z.object({
  governorate: z.string().min(1, 'هذا الحقل مطلوب'),
  district: z.string().min(1, 'هذا الحقل مطلوب'),
  subDistrict: z.string().min(1, 'هذا الحقل مطلوب'),
  department: z.string().min(1, 'هذا الحقل مطلوب'),
  policeStation: z.string().min(1, 'هذا الحقل مطلوب'),
});

type ReportInfoFormValues = z.infer<typeof reportInfoSchema>;

const FIELDS: { name: keyof ReportInfoFormValues; label: string }[] = [
  { name: 'governorate', label: 'المحافظة' },
  { name: 'district', label: 'المنطقة' },
  { name: 'subDistrict', label: 'الناحية' },
  { name: 'department', label: 'الشعبة' },
  { name: 'policeStation', label: 'المركز' },
];

/**
 * There is no endpoint to change a user's own name/email/password — the
 * backend only exposes GET /users/me and PUT /users/me/report-info, so
 * those fields are shown read-only and only report-info is editable.
 */
export function ProfilePage() {
  const { data: user, isPending, isError } = useMe();

  return (
    <>
      <Helmet>
        <title>الملف الشخصي</title>
      </Helmet>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>الملف الشخصي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending && (
              <div className="space-y-2" aria-busy="true" aria-live="polite">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-6 w-32" />
              </div>
            )}

            {isError && (
              <p role="alert" className="text-sm text-destructive">
                فشل تحميل بيانات الملف الشخصي. يرجى المحاولة مرة أخرى.
              </p>
            )}

            {user && (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">الاسم الكامل</dt>
                  <dd className="font-medium">{user.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">البريد الإلكتروني</dt>
                  <dd className="font-medium">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">الدور</dt>
                  <dd className="font-medium">{ROLE_LABELS[user.role]}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">الحالة</dt>
                  <dd className="font-medium">{user.enabled ? 'نشط' : 'غير نشط'}</dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        {user && <ReportInfoCard reportInfo={user.reportInfo} />}
      </div>
    </>
  );
}

function ReportInfoCard({ reportInfo }: { reportInfo: ReportInfo | null }) {
  const mutation = useSetMyReportInfo();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReportInfoFormValues>({
    resolver: zodResolver(reportInfoSchema),
    values: reportInfo ?? {
      governorate: '',
      district: '',
      subDistrict: '',
      department: '',
      policeStation: '',
    },
  });

  const onSubmit = handleSubmit((values: ReportInfo) => {
    mutation.mutate(values, {
      onError: (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const body = error.details as ApiErrorBody | undefined;
          Object.entries(body?.fieldErrors ?? {}).forEach(([field, message]) => {
            setError(field as keyof ReportInfoFormValues, { message });
          });
        }
      },
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>بيانات الضبط</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          {FIELDS.map(({ name, label }) => (
            <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
              <Input id={name} aria-invalid={Boolean(errors[name])} {...register(name)} />
            </FormField>
          ))}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الحفظ…' : 'حفظ'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
