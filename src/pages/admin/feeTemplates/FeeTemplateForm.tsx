import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { Button } from '@/components/ui/Button';
import {
  feeTemplateSchema,
  defaultFeeTemplateValues,
  computeTemplateTotal,
  type FeeTemplateFormValues,
} from '@/schemas/feeTemplate.schema';
import { useClassNameOptions } from '@/hooks/useAcademicStructure';

interface FeeTemplateFormProps {
  defaultValues?: FeeTemplateFormValues;
  submitting?: boolean;
  submitLabel: string;
  lockClassName?: boolean;
  onSubmit: (values: FeeTemplateFormValues) => void;
}

const inputClass = 'glass-input w-full px-4 py-3 text-sm placeholder:text-blush-700/40 dark:placeholder:text-blush-200/30';
const labelClass = 'text-xs font-semibold text-blush-800/70 dark:text-blush-100/60 mb-1.5 block';
const errorClass = 'text-[11px] text-rose-600 mt-1';

let itemSeq = 0;
function nextItemId() {
  itemSeq += 1;
  return `item-${Date.now()}-${itemSeq}`;
}

export function FeeTemplateForm({
  defaultValues,
  submitting,
  submitLabel,
  lockClassName,
  onSubmit,
}: FeeTemplateFormProps) {
  const { options: classOptions } = useClassNameOptions();
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeeTemplateFormValues>({
    resolver: zodResolver(feeTemplateSchema),
    defaultValues: defaultValues ?? defaultFeeTemplateValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    reset(defaultValues ?? defaultFeeTemplateValues);
  }, [defaultValues, reset]);

  const items = watch('items');
  const total = computeTemplateTotal(items ?? []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
      <div>
        <label className={labelClass}>Class</label>
        <select
          {...register('className')}
          disabled={lockClassName}
          className={clsx(inputClass, 'appearance-none', lockClassName && 'opacity-60 cursor-not-allowed')}
        >
          {classOptions.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.className && <p className={errorClass}>{errors.className.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Academic year (optional)</label>
        <input {...register('academicYear')} className={inputClass} placeholder="2024-25" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={labelClass.replace('mb-1.5', 'mb-0')}>Fee items</label>
          <button
            type="button"
            onClick={() => append({ id: nextItemId(), name: '', amount: 0 })}
            className="flex items-center gap-1 text-xs font-semibold text-blush-600"
          >
            <HiOutlinePlus size={14} /> Add item
          </button>
        </div>

        <div className="space-y-2.5">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`items.${index}.name` as const)}
                className={clsx(inputClass, 'flex-1')}
                placeholder="Tuition Fee"
              />
              <input
                type="number"
                step="1"
                {...register(`items.${index}.amount` as const)}
                className={clsx(inputClass, 'w-24')}
                placeholder="0"
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Remove item"
                className="w-9 h-9 shrink-0 rounded-xl2 flex items-center justify-center text-rose-600 glass-pill"
              >
                <HiOutlineTrash size={15} />
              </button>
            </div>
          ))}
        </div>
        {errors.items && <p className={errorClass}>{errors.items.message as string}</p>}
      </div>

      <div className="glass-card !bg-blush-50/40 flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">Total per student</span>
        <span className="font-display font-semibold text-base">₹{total.toLocaleString('en-IN')}</span>
      </div>

      <Button type="submit" fullWidth size="lg" disabled={submitting} className={submitting ? '!opacity-70 !cursor-wait' : ''}>
        {submitting ? 'Saving…' : submitLabel}
      </Button>
    </form>
  );
}
