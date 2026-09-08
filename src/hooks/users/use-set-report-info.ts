import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setMyReportInfo, setReportInfo } from '@/lib/users/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';

export function useSetMyReportInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setMyReportInfo,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم تحديث بيانات التقرير.');
    },
  });
}

export function useSetReportInfo(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof setReportInfo>[1]) => setReportInfo(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      notify.success('تم تحديث بيانات التقرير.');
    },
  });
}
