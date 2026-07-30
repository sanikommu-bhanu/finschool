import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { HiOutlineChevronLeft } from 'react-icons/hi';
import { Screen } from '@/components/layout/Screen';
import { SchoolProfileTab } from './SchoolProfileTab';
import { AcademicYearsTab } from './AcademicYearsTab';
import { ClassesTab } from './ClassesTab';

type Tab = 'profile' | 'years' | 'classes';

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'School' },
  { id: 'years', label: 'Years' },
  { id: 'classes', label: 'Grades & Classes' },
];

/**
 * Admin: School / Academic Year / Grade / Class(Section) management.
 *
 * This is additive reference-data tooling — see the header comment in
 * academicStructure.schema.ts for why it doesn't rewire any of the 21 existing
 * files that already key off the flat `className` string. Nothing about existing
 * students/teachers/fee-templates/join-codes/attendance/etc. screens changes here.
 */
export default function AcademicStructure() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <Screen>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate(-1)} className="glass-pill w-9 h-9 flex items-center justify-center">
          <HiOutlineChevronLeft size={18} />
        </button>
        <h1 className="font-display text-lg font-semibold flex-1">Academic Structure</h1>
      </div>

      <div className="glass-pill flex items-center p-1 mb-5 text-xs font-semibold">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 py-2 rounded-full transition-colors text-center',
              tab === t.id ? 'bg-gradient-cta text-white' : 'text-blush-700/60 dark:text-blush-200/50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && <SchoolProfileTab />}
      {tab === 'years' && <AcademicYearsTab />}
      {tab === 'classes' && <ClassesTab />}
    </Screen>
  );
}
