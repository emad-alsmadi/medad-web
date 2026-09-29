import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectItem,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { useAuthContext } from '@/contexts/auth-context';
import { exceedsPermissions } from '@/lib/auth/permissions';
import type { RoleResponse } from '@/types/role';

interface RoleSelectProps {
  id: string;
  roles: RoleResponse[];
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}

/** Roles granting something the current user lacks are shown but can't be picked (403 otherwise). */
export function RoleSelect({ id, roles, value, onChange, invalid, disabled }: RoleSelectProps) {
  const { user } = useAuthContext();

  return (
    <DropdownSelect value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <DropdownSelectTrigger id={id} aria-invalid={invalid}>
        <DropdownSelectValue placeholder="اختر الدور" />
      </DropdownSelectTrigger>
      <DropdownSelectContent>
        {roles.map((role) => {
          const beyondMe = exceedsPermissions(role.permissions, user?.permissions);
          return (
            <DropdownSelectItem key={role.id} value={String(role.id)} disabled={beyondMe}>
              {role.name}
              {beyondMe && ' — يتجاوز صلاحياتك'}
            </DropdownSelectItem>
          );
        })}
      </DropdownSelectContent>
    </DropdownSelect>
  );
}
