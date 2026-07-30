import { listStudents } from '@/services/students.service';
import { listPayments } from '@/services/payments.service';
import { listTeachers } from '@/services/teachers.service';
import { listParents } from '@/services/parents.service';
import { toDate } from '@/lib/timeAgo';

/**
 * "The AI should understand Firestore data" (spec, AI section). Rather than giving Grok
 * raw tool-calling access to the database (extra infra, and a prompt-injection surface),
 * we pull a compact aggregated snapshot server-side-of-the-client on each question and
 * inline it into the system prompt. This keeps answers grounded in real numbers while
 * never sending individual student names/contact info to a third-party API.
 */
export interface SchoolSnapshot {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  feeStatusBreakdown: { paid: number; due: number; overdue: number };
  totalPendingFees: number;
  collectionLast30Days: number;
  paymentsLast30Days: number;
  classWiseCounts: Record<string, number>;
  topOverdueClasses: { className: string; overdueAmount: number }[];
}

export async function buildSchoolSnapshot(): Promise<SchoolSnapshot> {
  const [students, payments, teachers, parents] = await Promise.all([
    listStudents(),
    listPayments(),
    listTeachers(),
    listParents(),
  ]);

  const feeStatusBreakdown = { paid: 0, due: 0, overdue: 0 };
  const classWiseCounts: Record<string, number> = {};
  const overdueByClass: Record<string, number> = {};
  let totalPendingFees = 0;

  for (const s of students) {
    feeStatusBreakdown[s.feeStatus] += 1;
    classWiseCounts[s.className] = (classWiseCounts[s.className] || 0) + 1;
    if (s.feeStatus !== 'paid') totalPendingFees += s.feeDue || 0;
    if (s.feeStatus === 'overdue') overdueByClass[s.className] = (overdueByClass[s.className] || 0) + (s.feeDue || 0);
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPayments = payments.filter((p) => {
    const d = toDate(p.createdAt);
    return d && d >= thirtyDaysAgo && p.status === 'success';
  });

  const topOverdueClasses = Object.entries(overdueByClass)
    .map(([className, overdueAmount]) => ({ className, overdueAmount }))
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, 5);

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalParents: parents.length,
    feeStatusBreakdown,
    totalPendingFees,
    collectionLast30Days: recentPayments.reduce((sum, p) => sum + p.amount, 0),
    paymentsLast30Days: recentPayments.length,
    classWiseCounts,
    topOverdueClasses,
  };
}

export function formatSnapshotForPrompt(snap: SchoolSnapshot): string {
  const classLines = Object.entries(snap.classWiseCounts)
    .map(([cls, count]) => `${cls}: ${count} students`)
    .join(', ');
  const overdueLines = snap.topOverdueClasses.map((c) => `${c.className} (Rs. ${c.overdueAmount.toLocaleString('en-IN')})`).join(', ') || 'none';

  return `Live school data snapshot (Firestore, just fetched):
- Total students: ${snap.totalStudents} | Teachers: ${snap.totalTeachers} | Parents: ${snap.totalParents}
- Fee status: ${snap.feeStatusBreakdown.paid} paid, ${snap.feeStatusBreakdown.due} due, ${snap.feeStatusBreakdown.overdue} overdue
- Total pending fees across school: Rs. ${snap.totalPendingFees.toLocaleString('en-IN')}
- Collection in last 30 days: Rs. ${snap.collectionLast30Days.toLocaleString('en-IN')} across ${snap.paymentsLast30Days} payments
- Class-wise enrollment: ${classLines || 'no data'}
- Classes with highest overdue fees: ${overdueLines}

Use these real numbers whenever the question relates to fees, revenue, students, or collections. Do not invent figures beyond this snapshot — if something isn't in it, say so plainly.`;
}
