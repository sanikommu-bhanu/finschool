import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getSchoolProfile,
  saveSchoolProfile,
  listAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  listGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  listClassSections,
  createClassSection,
  updateClassSection,
  deleteClassSection,
} from '@/services/academicStructure.service';
import type {
  SchoolProfileFormValues,
  AcademicYearFormValues,
  GradeFormValues,
  ClassSectionFormValues,
} from '@/schemas/academicStructure.schema';
import { CLASS_OPTIONS } from '@/schemas/student.schema';

const SCHOOL_KEY = ['schoolProfile'] as const;
const YEARS_KEY = ['academicYears'] as const;
const GRADES_KEY = ['grades'] as const;
const CLASSES_KEY = ['classSections'] as const;

// ---- School profile ----------------------------------------------------------------

export function useSchoolProfile() {
  return useQuery({ queryKey: SCHOOL_KEY, queryFn: getSchoolProfile, staleTime: 30_000 });
}

export function useSaveSchoolProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SchoolProfileFormValues) => saveSchoolProfile(data),
    onSuccess: () => {
      toast.success('School profile saved');
      qc.invalidateQueries({ queryKey: SCHOOL_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not save school profile'),
  });
}

// ---- Academic years ------------------------------------------------------------------

export function useAcademicYears() {
  return useQuery({ queryKey: YEARS_KEY, queryFn: listAcademicYears, staleTime: 30_000 });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AcademicYearFormValues) => createAcademicYear(data),
    onSuccess: () => {
      toast.success('Academic year added');
      qc.invalidateQueries({ queryKey: YEARS_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add academic year'),
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AcademicYearFormValues> }) =>
      updateAcademicYear(id, data),
    onSuccess: () => {
      toast.success('Academic year updated');
      qc.invalidateQueries({ queryKey: YEARS_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update academic year'),
  });
}

export function useDeleteAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAcademicYear(id),
    onSuccess: () => {
      toast.success('Academic year removed');
      qc.invalidateQueries({ queryKey: YEARS_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove academic year'),
  });
}

// ---- Grades ---------------------------------------------------------------------------

export function useGrades() {
  return useQuery({ queryKey: GRADES_KEY, queryFn: listGrades, staleTime: 30_000 });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GradeFormValues) => createGrade(data),
    onSuccess: () => {
      toast.success('Grade added');
      qc.invalidateQueries({ queryKey: GRADES_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add grade'),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GradeFormValues> }) => updateGrade(id, data),
    onSuccess: () => {
      toast.success('Grade updated');
      qc.invalidateQueries({ queryKey: GRADES_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update grade'),
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGrade(id),
    onSuccess: () => {
      toast.success('Grade removed');
      qc.invalidateQueries({ queryKey: GRADES_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove grade'),
  });
}

// ---- Classes (sections) ----------------------------------------------------------------

export function useClassSections() {
  return useQuery({ queryKey: CLASSES_KEY, queryFn: listClassSections, staleTime: 30_000 });
}

export function useCreateClassSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassSectionFormValues) => createClassSection(data),
    onSuccess: () => {
      toast.success('Class added');
      qc.invalidateQueries({ queryKey: CLASSES_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not add class'),
  });
}

export function useUpdateClassSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassSectionFormValues> }) =>
      updateClassSection(id, data),
    onSuccess: () => {
      toast.success('Class updated');
      qc.invalidateQueries({ queryKey: CLASSES_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not update class'),
  });
}

export function useDeleteClassSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClassSection(id),
    onSuccess: () => {
      toast.success('Class removed');
      qc.invalidateQueries({ queryKey: CLASSES_KEY });
    },
    onError: (e: Error) => toast.error(e.message || 'Could not remove class'),
  });
}

// ---- Bridge for the 21 existing className-consuming screens -------------------------
//
// Pilot for the "wire Grade/Class into existing screens" backlog item. This is the
// *only* new thing those screens need: a drop-in replacement for reading the
// hardcoded `CLASS_OPTIONS` array directly, that instead prefers real `classes` docs
// once an admin has defined them on the Academic Structure screen, and silently
// falls back to the exact original `CLASS_OPTIONS` list otherwise.
//
// Zero-risk swap for any screen that only ever used CLASS_OPTIONS to *render a
// dropdown of valid class-name strings*: swap the import for `useClassNameOptions()`
// and nothing else has to change, because until an admin actually adds classes on the
// new screen, the returned list is identical to before, in the same order. Only once
// classes are populated does behavior change, and only in the intended way.
//
// Deliberately NOT wired into every consumer in this pass — see PROGRESS.md for
// which of the 3 dropdown call sites (StudentForm, StudentList, FeeTemplateForm)
// have been switched over vs. still deferred, and why.
export function useClassNameOptions(): { options: string[]; isLoading: boolean; usingCustomClasses: boolean } {
  const { data: sections, isLoading } = useClassSections();

  return useMemo(() => {
    const names = (sections ?? [])
      .map((s) => s.className)
      .filter((name, i, arr) => name && arr.indexOf(name) === i); // de-dupe, keep first occurrence

    if (names.length > 0) {
      return { options: names, isLoading, usingCustomClasses: true };
    }
    // No classes defined yet in the new Academic Structure screen — fall back to the
    // exact list every existing screen has always used, unchanged.
    return { options: [...CLASS_OPTIONS], isLoading, usingCustomClasses: false };
  }, [sections, isLoading]);
}
