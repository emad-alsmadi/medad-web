import { useEffect, useState } from 'react';
import {
  useFormTypeAncestorChain,
  useFormTypeChildren,
  useFormTypeRoots,
} from '@/hooks/form-types/use-form-types';
import { FormField } from '@/components/ui/form-field';
import {
  DropdownSelect,
  DropdownSelectContent,
  DropdownSelectItem,
  DropdownSelectTrigger,
  DropdownSelectValue,
} from '@/components/ui/dropdown-select';
import { isSelectableFormType } from '@/types/form-type';
import type { FormTypeResponse } from '@/types/form-type';

interface FormTypeCascadeSelectProps {
  /** The chosen leaf form type id, as a string (react-hook-form convention), or ''. */
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

/**
 * Category -> sub-type cascading select for نموذج الضبط, driven by
 * GET /form-types/roots and GET /form-types/{id}/children. Every level's
 * options carry `childrenCount`, so picking one with sub-types reveals the
 * next level, while picking a leaf commits it as the report's formTypeId
 * (the backend rejects a category with 400).
 */
export function FormTypeCascadeSelect({ value, onChange, error }: FormTypeCascadeSelectProps) {
  const { data: roots = [] } = useFormTypeRoots();
  // The chosen type at each level, root first.
  const [path, setPath] = useState<FormTypeResponse[]>([]);

  // Edit mode: rebuild the path from the saved leaf once its ancestors load.
  const { data: ancestorChain } = useFormTypeAncestorChain(value ? Number(value) : null);
  useEffect(() => {
    if (ancestorChain) setPath(ancestorChain);
  }, [ancestorChain]);

  // The form was reset (e.g. after creating a report): drop the stale selection.
  const lastSelected = path[path.length - 1];
  useEffect(() => {
    if (!value && lastSelected && isSelectableFormType(lastSelected)) setPath([]);
  }, [value, lastSelected]);

  function select(levelIndex: number, type: FormTypeResponse) {
    setPath((current) => [...current.slice(0, levelIndex), type]);
    onChange(isSelectableFormType(type) ? String(type.id) : '');
  }

  // The error belongs under the level still waiting for a choice: the deepest one shown.
  const lastLevel = !lastSelected || isSelectableFormType(lastSelected) ? path.length - 1 : path.length;
  const errorAt = Math.max(0, lastLevel);

  return (
    <>
      <FormTypeLevel
        id="formTypeLevel-0"
        label="تصنيف نموذج الضبط"
        options={roots}
        selected={path[0]}
        onSelect={(type) => select(0, type)}
        error={errorAt === 0 ? error : undefined}
        required
      />
      {path.map((node, i) =>
        isSelectableFormType(node) ? null : (
          <FormTypeChildLevel
            key={node.id}
            levelIndex={i + 1}
            parentId={node.id}
            selected={path[i + 1]}
            onSelect={(type) => select(i + 1, type)}
            error={errorAt === i + 1 ? error : undefined}
          />
        ),
      )}
    </>
  );
}

interface FormTypeChildLevelProps {
  levelIndex: number;
  parentId: number;
  selected?: FormTypeResponse;
  onSelect: (type: FormTypeResponse) => void;
  error?: string;
}

function FormTypeChildLevel({
  levelIndex,
  parentId,
  selected,
  onSelect,
  error,
}: FormTypeChildLevelProps) {
  const { data: options = [] } = useFormTypeChildren(parentId);

  return (
    <FormTypeLevel
      id={`formTypeLevel-${levelIndex}`}
      label={levelIndex === 1 ? 'نموذج الضبط' : `نموذج فرعي ${levelIndex}`}
      options={options}
      selected={selected}
      onSelect={onSelect}
      error={error}
      required
    />
  );
}

interface FormTypeLevelProps {
  id: string;
  label: string;
  options: FormTypeResponse[];
  selected?: FormTypeResponse;
  onSelect: (type: FormTypeResponse) => void;
  error?: string;
  required?: boolean;
}

function FormTypeLevel({
  id,
  label,
  options,
  selected,
  onSelect,
  error,
  required,
}: FormTypeLevelProps) {
  return (
    <FormField label={label} htmlFor={id} error={error} required={required}>
      <DropdownSelect
        value={selected ? String(selected.id) : ''}
        onValueChange={(next) => {
          const type = options.find((t) => String(t.id) === next);
          if (type) onSelect(type);
        }}
      >
        <DropdownSelectTrigger id={id} aria-invalid={Boolean(error)}>
          <DropdownSelectValue placeholder="اختر…" />
        </DropdownSelectTrigger>
        <DropdownSelectContent>
          {options.map((t) => (
            <DropdownSelectItem key={t.id} value={String(t.id)}>
              {t.name}
            </DropdownSelectItem>
          ))}
        </DropdownSelectContent>
      </DropdownSelect>
    </FormField>
  );
}
