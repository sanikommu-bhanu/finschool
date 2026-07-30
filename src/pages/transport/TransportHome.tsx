import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineTruck,
  HiOutlineUserGroup,
  HiOutlineMap,
  HiOutlineChevronRight,
  HiOutlineLocationMarker,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
import { Screen } from '@/components/layout/Screen';
import { TopBar } from '@/components/layout/TopBar';
import { GlassCard } from '@/components/ui/GlassCard';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { useTransportRoutes } from '@/hooks/useTransportRoutes';

export default function TransportHome() {
  const navigate = useNavigate();
  const { data: vehicles = [], isLoading: vLoading } = useVehicles();
  const { data: drivers = [], isLoading: dLoading } = useDrivers();
  const { data: routes = [], isLoading: rLoading } = useTransportRoutes();

  const isLoading = vLoading || dLoading || rLoading;
  
  const activeVehicles = useMemo(() => vehicles.filter((v) => v.status === 'active').length, [vehicles]);
  const maintenanceVehicles = useMemo(() => vehicles.filter((v) => v.status === 'maintenance').length, [vehicles]);
  
  const totalStudents = useMemo(() => routes.reduce((sum, r) => sum + (r.studentIds?.length ?? 0), 0), [routes]);
  const delayedRoutes = useMemo(() => routes.filter((r) => r.status === 'delayed'), [routes]);
  
  const activeRoutes = useMemo(() => routes.filter((r) => r.status !== 'inactive'), [routes]);

  if (isLoading) {
    return (
      <Screen>
        <TopBar subtitle="Fleet Management Center" />
        <DashboardSkeleton />
      </Screen>
    );
  }

  const quickActions = [
    { label: 'Vehicles', icon: HiOutlineTruck, path: 'vehicles', count: vehicles.length, bg: 'bg-emerald-200/60', text: 'text-emerald-700 dark:text-emerald-300' },
    { label: 'Drivers', icon: HiOutlineUserGroup, path: 'drivers', count: drivers.length, bg: 'bg-indigo-200/60', text: 'text-indigo-700 dark:text-indigo-300' },
    { label: 'Routes', icon: HiOutlineMap, path: 'routes', count: routes.length, bg: 'bg-sky-200/60', text: 'text-sky-700 dark:text-sky-300' },
    { label: 'Service', icon: HiOutlineWrenchScrewdriver, path: 'maintenance', count: maintenanceVehicles, bg: 'bg-amber-200/60', text: 'text-amber-700 dark:text-amber-300' },
  ];

  return (
    <Screen>
      <TopBar subtitle="Fleet Management Center" />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pb-6">
        
        {/* Fleet KPI Hero */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-400/20 to-indigo-400/20 rounded-3xl blur-xl" />
          <GlassCard padding="lg" glow className="relative z-10 overflow-hidden !border-white/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-300/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-sky-700/60 dark:text-sky-200/60 mb-2">Fleet Status</p>
            
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight">{activeVehicles}</p>
                  <span className="text-sm font-semibold text-sky-700/60 dark:text-sky-200/50 mb-1">/ {vehicles.length} Active</span>
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1">Vehicles On Road</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-sky-500/15 flex items-center justify-center shrink-0">
                <HiOutlineTruck size={24} className="text-sky-600" />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-sky-200/20 dark:border-white/10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-sky-700/50 dark:text-sky-200/40 mb-1">Students Commuting</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <HiOutlineUserGroup className="text-sky-500" /> {totalStudents}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-sky-700/50 dark:text-sky-200/40 mb-1">Active Routes</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                  <HiOutlineMap className="text-emerald-500" /> {activeRoutes.length}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Actionable Fleet Alerts */}
        {delayedRoutes.length > 0 && (
          <GlassCard padding="md" className="mb-6 flex gap-3 items-center !bg-amber-50/40 dark:!bg-amber-950/20 border-amber-200/50" onClick={() => navigate('routes')}>
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-200/60 flex items-center justify-center">
              <HiOutlineExclamationCircle size={20} className="text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{delayedRoutes.length} Route{delayedRoutes.length > 1 ? 's' : ''} Delayed</p>
              <p className="text-[10px] uppercase font-bold text-amber-700/60 dark:text-amber-300/60">Tap to track live status</p>
            </div>
            <HiOutlineChevronRight size={18} className="text-amber-400 shrink-0" />
          </GlassCard>
        )}

        {/* Quick Operations */}
        <h2 className="font-display font-semibold text-sm mb-3">Management</h2>
        <div className="grid grid-cols-4 gap-2 mb-6">
          {quickActions.map((a) => (
            <GlassCard key={a.label} padding="sm" className="flex flex-col items-center gap-2 text-center py-3" onClick={() => navigate(a.path)}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-glass ${a.bg}`}>
                <a.icon className={a.text} size={20} />
              </div>
              <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{a.label}</span>
            </GlassCard>
          ))}
        </div>

        {/* Route Status Feed */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm">Live Route Status</h2>
          <button onClick={() => navigate('routes')} className="text-[10px] uppercase font-bold text-blush-600 flex items-center gap-1">
            Map View <HiOutlineLocationMarker />
          </button>
        </div>
        
        {routes.length === 0 ? (
          <EmptyState icon={HiOutlineMap} title="No routes yet" description="Set up your first transport route to get started." />
        ) : (
          <div className="space-y-3">
            {routes.slice(0, 4).map((r) => (
              <GlassCard key={r.id} padding="sm" className="flex items-center gap-3 relative overflow-hidden" onClick={() => navigate('routes')}>
                {r.status === 'delayed' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />}
                {r.status === 'on_time' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ml-1 ${r.status === 'delayed' ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                  <HiOutlineTruck size={18} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">{r.name}</p>
                  <p className="text-[11px] text-blush-700/60 truncate flex items-center gap-1 mt-0.5">
                    <HiOutlineLocationMarker size={10} /> {r.stops.length} stops · {r.studentIds?.length ?? 0} students
                  </p>
                </div>
                
                <span className={
                  r.status === 'on_time' ? 'text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600' :
                  r.status === 'delayed' ? 'text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 animate-pulse' :
                  'text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500/15 text-rose-600'
                }>
                  {r.status === 'on_time' ? 'ON TIME' : r.status === 'delayed' ? 'DELAYED' : 'INACTIVE'}
                </span>
              </GlassCard>
            ))}
          </div>
        )}
      </motion.div>
    </Screen>
  );
}
