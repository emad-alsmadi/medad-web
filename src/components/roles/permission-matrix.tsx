import { useState } from 'react';
import { Info } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  can,
  requiredBy,
  withRequiredPermissions,
  type PermissionSet,
} from '@/lib/auth/permissions';
import type {
  Action,
  PermissionOption,
  Permissions,
  Resource,
  RoleOptionsResponse,
} from '@/types/role';

const GUIDE_ID = 'permission-guide';

interface PermissionMatrixProps {
  options: RoleOptionsResponse;
  value: PermissionSet;
  onChange: (value: PermissionSet) => void;
  /** The editor's own permissions: anything beyond them can't be granted (403), so it is locked. */
  held: Permissions | null | undefined;
  readOnly?: boolean;
}

/**
 * Resources × actions, all from GET /roles/options (API guide §4.5): the
 * labels, each cell's `description` (its tooltip, and the guide under the
 * table for the hovered or focused cell), and its `requires`. Granting a
 * cell grants what it requires; a cell another granted one requires stays
 * checked and locked, with the reason, until that one is removed.
 */
export function PermissionMatrix({
  options,
  value,
  onChange,
  held,
  readOnly,
}: PermissionMatrixProps) {
  const [active, setActive] = useState<PermissionOption | null>(null);
  const actionOrder = options.actions.map((a) => a.value);
  const resourceLabel = new Map(options.resources.map((r) => [r.value, r.label]));
  const actionLabel = new Map(options.actions.map((a) => [a.value, a.label]));
  const optionFor = (resource: Resource, action: Action) =>
    options.permissions.find((o) => o.resource === resource && o.action === action);
  const cellName = (resource: Resource, action: Action) =>
    `${resourceLabel.get(resource) ?? resource} — ${actionLabel.get(action) ?? action}`;
  const namesOf = (pairs: [Resource, Action][]) =>
    pairs.map(([resource, action]) => cellName(resource, action)).join('، ');

  const lockReason = (resource: Resource, action: Action): string | null => {
    const dependents = requiredBy(value, options.permissions, resource, action);
    return dependents.length > 0
      ? `مطلوبة لـ: ${namesOf(dependents.map((o) => [o.resource, o.action]))}`
      : null;
  };

  const commit = (next: PermissionSet) => {
    const complete = withRequiredPermissions(next, options.permissions, held);
    const ordered: PermissionSet = {};
    (Object.keys(complete) as Resource[]).forEach((resource) => {
      const actions = new Set(complete[resource]);
      ordered[resource] = actionOrder.filter((a) => actions.has(a));
    });
    onChange(ordered);
  };

  const setRow = (resource: Resource, actions: Action[]) =>
    commit({ ...value, [resource]: actions });

  const toggle = (resource: Resource, action: Action, checked: boolean) => {
    const current = value[resource] ?? [];
    setRow(resource, checked ? [...current, action] : current.filter((a) => a !== action));
  };

  const activeRequires = active
    ? (Object.entries(active.requires) as [Resource, Action[]][]).flatMap(([resource, actions]) =>
        actions
          .filter((a) => !(resource === active.resource && a === active.action))
          .map((a): [Resource, Action] => [resource, a]),
      )
    : [];
  const activeLock = active ? lockReason(active.resource, active.action) : null;

  return (
    <div className="rounded-lg border border-border-subtle">
      <div className="overflow-x-auto" onMouseLeave={() => setActive(null)}>
        <table className="w-full min-w-[32rem] text-sm">
          <caption className="sr-only">صلاحيات الدور</caption>
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-semibold">
                المورد
              </th>
              {options.actions.map((action) => (
                <th key={action.value} scope="col" className="px-3 py-2 text-center font-semibold">
                  {action.label}
                </th>
              ))}
              <th scope="col" className="px-3 py-2 text-center font-semibold">
                الكل
              </th>
            </tr>
          </thead>
          <tbody>
            {options.resources.map((resource) => {
              const granted = value[resource.value] ?? [];
              const grantable = actionOrder.filter((a) => can(held, resource.value, a));
              const allChecked =
                grantable.length > 0 && grantable.every((a) => granted.includes(a));
              return (
                <tr key={resource.value} className="border-t border-border-subtle">
                  <th scope="row" className="px-3 py-2 text-start font-medium">
                    {resource.label}
                  </th>
                  {options.actions.map((action) => {
                    const option = optionFor(resource.value, action.value);
                    const notHeld = !can(held, resource.value, action.value);
                    const checked = granted.includes(action.value);
                    const required = checked ? lockReason(resource.value, action.value) : null;
                    const reason = notHeld ? 'لا تملك هذه الصلاحية' : required;
                    const title = [option?.description, readOnly ? null : reason]
                      .filter(Boolean)
                      .join('\n');
                    return (
                      <td
                        key={action.value}
                        className="px-3 py-2 text-center"
                        onMouseEnter={() => option && setActive(option)}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            if (required === null) toggle(resource.value, action.value, next);
                          }}
                          onFocus={() => option && setActive(option)}
                          disabled={readOnly || notHeld}
                          // Required, not forbidden: aria-disabled keeps it clearly checked (a
                          // disabled box turns grey) and focusable, so its reason can be read.
                          aria-disabled={required !== null || undefined}
                          className={
                            required !== null && !readOnly ? 'cursor-not-allowed' : undefined
                          }
                          title={title || undefined}
                          aria-label={`${resource.label} — ${action.label}`}
                          aria-describedby={GUIDE_ID}
                        />
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-center">
                    <Checkbox
                      checked={allChecked}
                      indeterminate={!allChecked && granted.length > 0}
                      onCheckedChange={(checked) =>
                        // Clearing the row keeps whatever other cells still require (commit adds it back).
                        setRow(
                          resource.value,
                          checked
                            ? [...granted, ...grantable]
                            : granted.filter((a) => !grantable.includes(a)),
                        )
                      }
                      disabled={readOnly || grantable.length === 0}
                      aria-label={`${resource.label} — كل الصلاحيات`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        id={GUIDE_ID}
        aria-live="polite"
        className="flex min-h-[4.5rem] gap-2 border-t border-border-subtle bg-muted/30 px-3 py-2 text-xs leading-5"
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        {active ? (
          <div className="space-y-0.5">
            <p className="font-semibold">{cellName(active.resource, active.action)}</p>
            <p>{active.description}</p>
            {activeRequires.length > 0 && (
              <p className="text-muted-foreground">تحتاج معها: {namesOf(activeRequires)}</p>
            )}
            {activeLock && !readOnly && <p className="text-muted-foreground">{activeLock}</p>}
          </div>
        ) : (
          <p className="text-muted-foreground">
            مرّر المؤشر على أي خانة أو انتقل إليها لمعرفة ما تمنحه وما تحتاجه. تفعيل خانة يفعّل ما
            تحتاجه، والخانة التي تحتاجها خانة مفعّلة تبقى محددة حتى تُلغى تلك.
          </p>
        )}
      </div>
    </div>
  );
}
