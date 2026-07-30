import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useAuthListener } from '@/hooks/useAuthListener';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

import Splash from '@/pages/Splash';
import Onboarding from '@/pages/Onboarding';
import Login from '@/pages/Login';
import AccountPicker from '@/pages/AccountPicker';
import RoleSelect from '@/pages/RoleSelect';
import JoinCodeEntry from '@/pages/onboarding/JoinCodeEntry';
import ProfileSetup from '@/pages/onboarding/ProfileSetup';
import TeacherClassVerify from '@/pages/onboarding/TeacherClassVerify';

import { RequireAuth, RequireAccount, RequireRole } from '@/layouts/RequireAuth';
import { RoleLayout } from '@/layouts/RoleLayout';
import AdminHome from '@/pages/admin/AdminHome';
import AdminSetup from '@/pages/admin/AdminSetup';
import StudentList from '@/pages/admin/students/StudentList';
import TeacherList from '@/pages/admin/teachers/TeacherList';
import ParentList from '@/pages/admin/parents/ParentList';
import Reports from '@/pages/admin/Reports';
import AIAssistant from '@/pages/admin/AIAssistant';
import ScanQR from '@/pages/shared/ScanQR';
import FeeTemplateList from '@/pages/admin/feeTemplates/FeeTemplateList';
import AcademicStructure from '@/pages/admin/academicStructure/AcademicStructure';

import AccountantHome from '@/pages/accountant/AccountantHome';
import CollectFee from '@/pages/accountant/CollectFee';
import TransactionHistory from '@/pages/accountant/TransactionHistory';
import Expenses from '@/pages/accountant/Expenses';
import ExpenseDetail from '@/pages/accountant/ExpenseDetail';

import ParentHome from '@/pages/parent/ParentHome';
import ParentFees from '@/pages/parent/ParentFees';
import ParentReceipts from '@/pages/parent/ParentReceipts';

import StudentHome from '@/pages/student/StudentHome';
import StudentFees from '@/pages/student/StudentFees';
import DigitalId from '@/pages/student/DigitalId';

import TeacherHome from '@/pages/teacher/TeacherHome';
import TeacherAttendance from '@/pages/teacher/TeacherAttendance';
import TeacherAssignments from '@/pages/teacher/TeacherAssignments';
import TeacherAnnouncements from '@/pages/teacher/TeacherAnnouncements';
import TeacherStudents from '@/pages/teacher/TeacherStudents';
import TeacherFeeReminders from '@/pages/teacher/TeacherFeeReminders';
import JoinCodes from '@/pages/teacher/JoinCodes';

import TransportHome from '@/pages/transport/TransportHome';
import Vehicles from '@/pages/transport/Vehicles';
import Drivers from '@/pages/transport/Drivers';
import TransportRoutes from '@/pages/transport/Routes';
import Maintenance from '@/pages/transport/Maintenance';
import RouteStudents from '@/pages/transport/RouteStudents';

import Notifications from '@/pages/shared/Notifications';
import Messages from '@/pages/shared/Messages';
import Profile from '@/pages/shared/Profile';
import Settings from '@/pages/shared/Settings';
import Search from '@/pages/shared/Search';
import HelpSupport from '@/pages/shared/HelpSupport';

import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCreditCard,
  HiOutlineDocumentReport,
  HiOutlineDotsHorizontal,
  HiOutlineReceiptTax,
  HiOutlineIdentification,
  HiOutlineClipboardCheck,
  HiOutlineTruck,
  HiOutlineMap,
  HiOutlineCash,
} from 'react-icons/hi';
import type { BottomNavItem } from '@/components/layout/BottomNav';

const adminNav: BottomNavItem[] = [
  { path: '/admin', label: 'Home', icon: HiOutlineHome, end: true },
  { path: '/admin/students', label: 'Users', icon: HiOutlineUsers },
  { path: '/admin/fee-templates', label: 'Finance', icon: HiOutlineCreditCard },
  { path: '/admin/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  { path: '/admin/settings', label: 'More', icon: HiOutlineDotsHorizontal },
];

const accountantNav: BottomNavItem[] = [
  { path: '/accountant', label: 'Home', icon: HiOutlineHome, end: true },
  { path: '/accountant/collect', label: 'Collect', icon: HiOutlineCreditCard },
  { path: '/accountant/expenses', label: 'Finance', icon: HiOutlineCash },
  { path: '/accountant/reports', label: 'Reports', icon: HiOutlineDocumentReport },
  { path: '/accountant/profile', label: 'More', icon: HiOutlineDotsHorizontal },
];

const parentNav: BottomNavItem[] = [
  { path: '/parent', label: 'Home', icon: HiOutlineHome, end: true },
  { path: '/parent/fees', label: 'Fees', icon: HiOutlineCreditCard },
  { path: '/parent/receipts', label: 'Receipts', icon: HiOutlineReceiptTax },
  { path: '/parent/profile', label: 'Profile', icon: HiOutlineDotsHorizontal },
];

const studentNav: BottomNavItem[] = [
  { path: '/student', label: 'Home', icon: HiOutlineHome, end: true },
  { path: '/student/fees', label: 'Fees', icon: HiOutlineCreditCard },
  { path: '/student/id', label: 'ID Card', icon: HiOutlineIdentification },
  { path: '/student/profile', label: 'Profile', icon: HiOutlineDotsHorizontal },
];

const teacherNav: BottomNavItem[] = [
  { path: '/teacher', label: 'Home', icon: HiOutlineHome, end: true },
  { path: '/teacher/students', label: 'Students', icon: HiOutlineUsers },
  { path: '/teacher/attendance', label: 'Attendance', icon: HiOutlineClipboardCheck },
  { path: '/teacher/profile', label: 'Profile', icon: HiOutlineDotsHorizontal },
];

const transportNav: BottomNavItem[] = [
  { path: '/transport', label: 'Home', icon: HiOutlineHome, end: true },
  { path: '/transport/vehicles', label: 'Vehicles', icon: HiOutlineTruck },
  { path: '/transport/routes', label: 'Routes', icon: HiOutlineMap },
  { path: '/transport/profile', label: 'Profile', icon: HiOutlineDotsHorizontal },
];


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function withSharedRoutes() {
  return (
    <>
      <Route path="notifications" element={<Notifications />} />
      <Route path="messages" element={<Messages />} />
      <Route path="profile" element={<Profile />} />
      <Route path="settings" element={<Settings />} />
      <Route path="search" element={<Search />} />
      <Route path="help" element={<HelpSupport />} />
    </>
  );
}

export default function App() {
  useThemeSync();
  useAuthListener();
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <OfflineBanner />
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />

          {/* Role selection happens BEFORE authentication, so it must be public.
              The chosen role is parked in authStore.pendingRole and committed to
              Firestore by Login once a uid exists. */}
          <Route path="/role-select" element={<RoleSelect />} />

          <Route element={<RequireAccount />}>
            <Route path="/accounts" element={<AccountPicker />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/join-code" element={<JoinCodeEntry />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/teacher-verify" element={<TeacherClassVerify />} />

            {/* Admin module — active build */}
            <Route element={<RequireRole allow="admin" />}>
              <Route path="/admin" element={<RoleLayout items={adminNav} />}>
                <Route index element={<AdminHome />} />
                <Route path="setup" element={<AdminSetup />} />
                <Route path="students" element={<StudentList />} />
                <Route path="teachers" element={<TeacherList />} />
                <Route path="parents" element={<ParentList />} />
                <Route path="reports" element={<Reports />} />
                <Route path="scan" element={<ScanQR />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="fee-templates" element={<FeeTemplateList />} />
                <Route path="academic-structure" element={<AcademicStructure />} />
                {withSharedRoutes()}
              </Route>
            </Route>

            {/* Accountant module — active build */}
            <Route element={<RequireRole allow="accountant" />}>
              <Route path="/accountant" element={<RoleLayout items={accountantNav} />}>
                <Route index element={<AccountantHome />} />
                <Route path="collect" element={<CollectFee />} />
                <Route path="history" element={<TransactionHistory />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="expenses/:id" element={<ExpenseDetail />} />
                <Route path="reports" element={<Reports />} />
                <Route path="scan" element={<ScanQR />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                {withSharedRoutes()}
              </Route>
            </Route>

            {/* Parent module — active build */}
            <Route element={<RequireRole allow="parent" />}>
              <Route path="/parent" element={<RoleLayout items={parentNav} />}>
                <Route index element={<ParentHome />} />
                <Route path="fees" element={<ParentFees />} />
                <Route path="receipts" element={<ParentReceipts />} />
                {withSharedRoutes()}
              </Route>
            </Route>

            {/* Student module — active build */}
            <Route element={<RequireRole allow="student" />}>
              <Route path="/student" element={<RoleLayout items={studentNav} />}>
                <Route index element={<StudentHome />} />
                <Route path="fees" element={<StudentFees />} />
                <Route path="id" element={<DigitalId />} />
                {withSharedRoutes()}
              </Route>
            </Route>

            {/* Teacher module — active build */}
            <Route element={<RequireRole allow="teacher" />}>
              <Route path="/teacher" element={<RoleLayout items={teacherNav} />}>
                <Route index element={<TeacherHome />} />
                <Route path="students" element={<TeacherStudents />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="assignments" element={<TeacherAssignments />} />
                <Route path="announcements" element={<TeacherAnnouncements />} />
                <Route path="fee-reminders" element={<TeacherFeeReminders />} />
                <Route path="join-codes" element={<JoinCodes />} />
                {withSharedRoutes()}
              </Route>
            </Route>

            {/* Transport module — active build */}
            <Route element={<RequireRole allow="transport" />}>
              <Route path="/transport" element={<RoleLayout items={transportNav} />}>
                <Route index element={<TransportHome />} />
                <Route path="vehicles" element={<Vehicles />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="routes" element={<TransportRoutes />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="route-students/:routeId" element={<RouteStudents />} />
                {withSharedRoutes()}
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Splash />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}
