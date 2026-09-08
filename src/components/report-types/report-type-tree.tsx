import type { ReportTypeTreeNode } from '@/types/report-type';

interface ReportTypeTreeProps {
  nodes: ReportTypeTreeNode[];
}

export function ReportTypeTree({ nodes }: ReportTypeTreeProps) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">لا توجد أنواع تقارير.</p>;
  }

  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
            <span className="font-medium">{node.name}</span>
            <span className="text-sm text-muted-foreground">(عدد الشهود: {node.witnessNumber})</span>
          </div>
          {node.children.length > 0 && (
            <div className="ms-6 border-s ps-2">
              <ReportTypeTree nodes={node.children} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
