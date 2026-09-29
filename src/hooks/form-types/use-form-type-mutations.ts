import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create, remove, update } from '@/lib/form-types/api';
import { queryKeys } from '@/lib/query/query-keys';
import { notify } from '@/lib/notifications/toast';
import { failureMessage } from '@/lib/api/errors';
import { formTypeSaveErrorMessage } from '@/lib/form-types/errors';
import { ApiError } from '@/lib/api/client';

function invalidateFormTypes(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.formTypes.all });
}

export function useCreateFormType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: create,
    onSuccess: () => {
      invalidateFormTypes(queryClient);
      notify.success('تم إنشاء نموذج الضبط.');
    },
    onError: (error) => {
      notify.error(
        formTypeSaveErrorMessage(error, 'فشل إنشاء نموذج الضبط. يرجى المحاولة مرة أخرى.'),
      );
    },
  });
}

export function useUpdateFormType(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof update>[1]) => update(id, body),
    onSuccess: () => {
      invalidateFormTypes(queryClient);
      notify.success('تم تحديث نموذج الضبط.');
    },
    onError: (error) => {
      notify.error(
        formTypeSaveErrorMessage(error, 'فشل تحديث نموذج الضبط. يرجى المحاولة مرة أخرى.'),
      );
    },
  });
}

export function useDeleteFormType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: remove,
    onSuccess: () => {
      invalidateFormTypes(queryClient);
      notify.success('تم حذف نموذج الضبط.');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        notify.error('لا يمكن الحذف: يحتوي هذا النموذج على أنواع فرعية أو ضبوط مرتبطة به.');
        return;
      }
      notify.error(failureMessage(error, 'فشل حذف نموذج الضبط. يرجى المحاولة مرة أخرى.'));
    },
  });
}
