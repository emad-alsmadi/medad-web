import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSetReportInfo } from '@/hooks/users/use-set-report-info';
import type { ReportInfo, UserResponse } from '@/types/user';
import { ApiError } from '@/lib/api/client';
import type { ApiErrorBody } from '@/types/api';

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

interface ReportInfoDialogProps {
  user: UserResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportInfoDialog({ user, open, onOpenChange }: ReportInfoDialogProps) {
  const mutation = useSetReportInfo(user.id);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReportInfoFormValues>({
    resolver: zodResolver(reportInfoSchema),
    values: user.reportInfo ?? {
      governorate: '',
      district: '',
      subDistrict: '',
      department: '',
      policeStation: '',
    },
  });

  const onSubmit = handleSubmit((values: ReportInfo) => {
    mutation.mutate(values, {
      onSuccess: () => onOpenChange(false),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>بيانات التقرير — {user.fullName}</DialogTitle>
        <DialogDescription>جميع الحقول مطلوبة.</DialogDescription>
        <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
          {FIELDS.map(({ name, label }) => (
            <FormField key={name} label={label} htmlFor={name} error={errors[name]?.message}>
              <Input id={name} aria-invalid={Boolean(errors[name])} {...register(name)} />
            </FormField>
          ))}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'جاري الحفظ…' : 'حفظ'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
