import { useState } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useReportOptions } from '@/hooks/reports/use-report-options';
import { useChangeReportResult } from '@/hooks/reports/use-report-mutations';
import { cn } from '@/lib/utils/cn';
import type { ReportResponse, ReportResult } from '@/types/report';

const RESULT_STYLES: Record<ReportResult, string> = {
  CLOSED: 'bg-syid-umber/10 text-syid-umber',
  UNDER_INVESTIGATION: 'bg-syid-gold/20 text-syid-gold-dark',
  FURTHER_INVESTIGATION: 'bg-syid-forest/10 text-syid-forest',
};

const BADGE_CLASS =
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold';

export function ReportResultBadge({ result }: { result: ReportResult | null }) {
  const { labels } = useReportOptions();
  return (
    <span
      className={cn(BADGE_CLASS, result ? RESULT_STYLES[result] : 'bg-muted text-muted-foreground')}
    >
      {result === 'CLOSED' && <Lock className="h-3 w-3" aria-hidden="true" />}
      {labels.result(result)}
    </span>
  );
}

/**
 * The report's result as a badge that doubles as a menu of the allowed
 * transitions (PATCH /reports/{id}/result). A CLOSED report shows a
 * plain locked badge — it can never leave that state — and moving to
 * CLOSED asks for confirmation first, since it seals the report for good.
 */
export function ReportResultControl({ report }: { report: ReportResponse }) {
  const { data: options, labels } = useReportOptions();
  const mutation = useChangeReportResult();
  const [confirmingClose, setConfirmingClose] = useState(false);

  if (report.result === 'CLOSED') return <ReportResultBadge result="CLOSED" />;

  const targets = (options?.results ?? []).filter((option) => option.value !== report.result);

  function change(result: ReportResult) {
    if (result === 'CLOSED') {
      setConfirmingClose(true);
      return;
    }
    mutation.mutate({ id: report.id, result });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={mutation.isPending}
          aria-label={`النتيجة: ${labels.result(report.result)}، تغيير النتيجة`}
          className={cn(
            BADGE_CLASS,
            report.result ? RESULT_STYLES[report.result] : 'bg-muted text-muted-foreground',
            'cursor-pointer outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60',
          )}
        >
          {labels.result(report.result)}
          <ChevronDown className="h-3 w-3" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>تغيير النتيجة إلى</DropdownMenuLabel>
          {targets.map((option) => (
            <DropdownMenuItem
              key={option.value}
              variant={option.value === 'CLOSED' ? 'destructive' : undefined}
              onSelect={() => change(option.value)}
            >
              {option.value === 'CLOSED' && <Lock />}
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmingClose}
        onOpenChange={setConfirmingClose}
        title="ختم الضبط"
        message="بعد الختم يصبح الضبط للقراءة فقط: لا يمكن تعديله أو حذفه أو تغيير نتيجته، ولا يمكن التراجع عن ذلك."
        itemLabel={`ضبط ${report.reportNumber}`}
        confirmLabel="ختم الضبط"
        isConfirming={mutation.isPending}
        onConfirm={() =>
          mutation.mutate(
            { id: report.id, result: 'CLOSED' },
            { onSettled: () => setConfirmingClose(false) },
          )
        }
      />
    </>
  );
}
