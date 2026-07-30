import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineChevronLeft, HiOutlineReceiptTax } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Fab } from '@/components/ui/Fab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FeeTemplateForm } from './FeeTemplateForm';
import {
  useFeeTemplates,
  useCreateFeeTemplate,
  useUpdateFeeTemplate,
  useDeleteFeeTemplate,
} from '@/hooks/useFeeTemplates';
import { defaultFeeTemplateValues, type FeeTemplateDoc, type FeeTemplateFormValues } from '@/schemas/feeTemplate.schema';

export default function FeeTemplateList() {
  const navigate = useNavigate();
  const { data: templates = [], isLoading, isError } = useFeeTemplates();
  const createMutation = useCreateFeeTemplate();
  const updateMutation = useUpdateFeeTemplate();
  const deleteMutation = useDeleteFeeTemplate();

  const [sheetMode, setSheetMode] = useState<'closed' | 'add' | 'edit'>('closed');
  const [activeTemplate, setActiveTemplate] = useState<FeeTemplateDoc | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setActiveTemplate(null);
    setSheetMode('add');
  };

  const openEdit = (t: FeeTemplateDoc) => {
    setActiveTemplate(t);
    setSheetMode('edit');
  };

  const closeSheet = () => setSheetMode('closed');

  const handleCreate = (values: FeeTemplateFormValues) => {
    createMutation.mutate(values, { onSuccess: closeSheet });
  };

  const handleUpdate = (values: FeeTemplateFormValues) => {
    if (!activeTemplate) return;
    updateMutation.mutate({ id: activeTemplate.id, data: values }, { onSuccess: closeSheet });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setConfirmDeleteId(null) });
  };

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold flex-1">Fee Templates</h1>
        <span className="text-xs font-semibold text-blush-700/60 dark:text-blush-200/50">
          {templates.length} {templates.length === 1 ? 'class' : 'classes'}
        </span>
      </div>

      <p className="text-xs text-blush-700/50 dark:text-blush-200/40 mb-4 leading-relaxed">
        One reusable fee template per class. New students in a class automatically get its current
        total as their fee due — editing a template never changes fees already paid or invoiced.
      </p>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl3" />
          <Skeleton className="h-20 w-full rounded-xl3" />
        </div>
      )}

      {isError && (
        <EmptyState
          icon={HiOutlineReceiptTax}
          title="Couldn't load fee templates"
          description="Check your connection and pull to refresh."
        />
      )}

      {!isLoading && !isError && templates.length === 0 && (
        <EmptyState
          icon={HiOutlineReceiptTax}
          title="No fee templates yet"
          description="Tap the + button to create the first fee template for a class."
        />
      )}

      <div className="space-y-3">
        {templates.map((t) => (
          <GlassCard key={t.id} padding="md" className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{t.className}</p>
              <p className="text-xs text-blush-700/50 dark:text-blush-200/40 truncate">
                {t.items.length} {t.items.length === 1 ? 'item' : 'items'}
                {t.academicYear ? ` · ${t.academicYear}` : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-display font-semibold text-sm">₹{t.totalAmount.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => openEdit(t)}
                aria-label="Edit template"
                className="w-8 h-8 rounded-xl2 flex items-center justify-center glass-pill"
              >
                <HiOutlinePencil size={14} />
              </button>
              <button
                onClick={() => setConfirmDeleteId(t.id)}
                aria-label="Delete template"
                className="w-8 h-8 rounded-xl2 flex items-center justify-center glass-pill !text-rose-600"
              >
                <HiOutlineTrash size={14} />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      <Fab icon={HiOutlinePlus} label="Add fee template" onClick={openAdd} />

      <BottomSheet open={sheetMode === 'add'} onClose={closeSheet} title="New fee template">
        <FeeTemplateForm
          defaultValues={defaultFeeTemplateValues}
          submitLabel="Create template"
          submitting={createMutation.isPending}
          onSubmit={handleCreate}
        />
      </BottomSheet>

      <BottomSheet open={sheetMode === 'edit'} onClose={closeSheet} title="Edit fee template">
        {activeTemplate && (
          <FeeTemplateForm
            defaultValues={activeTemplate}
            submitLabel="Save changes"
            submitting={updateMutation.isPending}
            lockClassName
            onSubmit={handleUpdate}
          />
        )}
      </BottomSheet>

      <BottomSheet open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} title="Remove fee template?">
        <p className="text-sm text-blush-700/70 dark:text-blush-200/50 mb-4">
          This deletes the template. Students who already have fees assigned from it are not affected.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="glass" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          <Button
            className="!bg-rose-600"
            disabled={deleteMutation.isPending}
            onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
          >
            {deleteMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  );
}
