import { FolderTree } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import type { FormTypeTreeNode } from '@/types/form-type';

interface FormTypeTreeProps {
  nodes: FormTypeTreeNode[];
  root?: boolean;
}

export function FormTypeTree({ nodes, root = true }: FormTypeTreeProps) {
  if (nodes.length === 0) {
    if (!root) return null;
    return <EmptyState icon={FolderTree} title="لا توجد نماذج ضبوط" />;
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
              <FormTypeTree nodes={node.children} root={false} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
