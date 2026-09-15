import { Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/constant/routes';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const reportId = Number(id);

  if (!id || Number.isNaN(reportId)) {
    return <Navigate to={ROUTES.reports.list} replace />;
  }

  return <Navigate to={`${ROUTES.reports.list}?view=${reportId}`} replace />;
}
