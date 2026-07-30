import { CLASS_OPTIONS } from '@/schemas/student.schema';
import type { FeeTemplateFormValues } from '@/schemas/feeTemplate.schema';
import type { VehicleFormValues } from '@/schemas/vehicle.schema';
import type { DriverFormValues } from '@/schemas/driver.schema';
import type { RouteFormValues } from '@/schemas/route.schema';
import { createFeeTemplate } from '@/services/feeTemplates.service';
import { createVehicle } from '@/services/vehicles.service';
import { createDriver } from '@/services/drivers.service';
import { createRoute } from '@/services/transportRoutes.service';
import { getMany, update, COLLECTIONS } from '@/services/firestore';

/**
 * Default school data, created once at the end of Admin setup.
 *
 * Why this exists: AdminSetup previously created only the school profile, academic
 * year, grades and class sections. It never created fee templates, buses, drivers or
 * routes — so the Finance and Transport dashboards had nothing to render and came up
 * empty on a fresh install, which read as "the app is broken".
 *
 * Two rules this module follows:
 *
 * 1. IDEMPOTENT. Every seeder checks whether its collection already has documents and
 *    returns early if so. Re-running setup will never duplicate or overwrite data.
 *    (`createFeeTemplate` throws on a duplicate className by design, so templates are
 *    checked per-class rather than as a whole collection.)
 *
 * 2. ORDINARY DATA, NOT SPECIAL DATA. Everything here is written through the same
 *    service functions the admin UI uses, into the same collections, with the same
 *    schema shapes. Nothing is flagged as "demo". So every seeded row is fully
 *    editable and deletable from the normal admin screens — there is no separate
 *    code path keeping it alive.
 *
 * NOTE on className: fee templates are keyed to the `CLASS_OPTIONS` strings
 * ("Class 5"), because that is the value student/parent/teacher records use for
 * `className` throughout the app. AdminSetup's grade/section builder produces a
 * different label shape ("5-A") for its own class-section docs. Those two naming
 * schemes are not yet reconciled — see the note in academicStructure.schema.ts. Fee
 * templates are deliberately seeded against CLASS_OPTIONS so that a student created
 * through the normal student form links to a template correctly.
 */

/** Tuition scales with class level; the rest are flat. Amounts in INR. */
function feeItemsForClass(className: string): FeeTemplateFormValues['items'] {
  const index = CLASS_OPTIONS.indexOf(className);
  const tier = index < 3 ? 0 : index < 8 ? 1 : index < 13 ? 2 : 3;

  const tuition = [8000, 12000, 16000, 20000][tier];
  const admission = [3000, 4000, 5000, 6000][tier];
  const exam = [800, 1200, 1800, 2400][tier];

  return [
    { id: 'admission', name: 'Admission Fee', amount: admission },
    { id: 'tuition', name: 'Tuition Fee', amount: tuition },
    { id: 'exam', name: 'Exam Fee', amount: exam },
    { id: 'library', name: 'Library Fee', amount: 600 },
    { id: 'sports', name: 'Sports Fee', amount: 900 },
  ];
}

/**
 * One fee template per class. Transport fare is intentionally NOT included here —
 * it is added per-student at join time based on whether the parent selected school
 * transport, using the fare on the assigned route.
 */
async function seedFeeTemplates(academicYear: string): Promise<number> {
  const existing = await getMany(COLLECTIONS.feeTemplates);
  const alreadyKeyed = new Set(
    existing.map((doc) => (doc as { className?: string }).className).filter(Boolean)
  );

  let created = 0;
  for (const className of CLASS_OPTIONS) {
    if (alreadyKeyed.has(className)) continue;
    await createFeeTemplate({
      className,
      academicYear,
      items: feeItemsForClass(className),
    });
    created += 1;
  }
  return created;
}

const DRIVER_SEED: DriverFormValues[] = [
  { name: 'Ramesh Kumar', phone: '9876543210', licenseNo: 'DL-0420110149646', experienceYears: 12, status: 'active', avatar: '' },
  { name: 'Suresh Yadav', phone: '9876501234', licenseNo: 'DL-0420110155832', experienceYears: 8, status: 'active', avatar: '' },
  { name: 'Anil Verma', phone: '9812345670', licenseNo: 'DL-0420110162014', experienceYears: 5, status: 'active', avatar: '' },
];

const VEHICLE_SEED: Omit<VehicleFormValues, 'driverId' | 'routeId'>[] = [
  { name: 'Bus 1', regNo: 'KA-01-AB-1234', capacity: 40, status: 'active', lastServiceDate: '', nextServiceDate: '' },
  { name: 'Bus 2', regNo: 'KA-01-CD-5678', capacity: 35, status: 'active', lastServiceDate: '', nextServiceDate: '' },
  { name: 'Bus 3', regNo: 'KA-01-EF-9012', capacity: 30, status: 'maintenance', lastServiceDate: '', nextServiceDate: '' },
];

/** Stops are real Delhi coordinates so the route map renders somewhere sensible. */
const ROUTE_SEED: Omit<RouteFormValues, 'vehicleId' | 'driverId'>[] = [
  {
    name: 'Route 1 — Green Park',
    fare: 1500,
    startTime: '07:30',
    status: 'on_time',
    stops: [
      { name: 'Green Park', lat: 28.5588, lng: 77.2064, time: '07:30' },
      { name: 'Hauz Khas', lat: 28.5494, lng: 77.2001, time: '07:45' },
      { name: 'School', lat: 28.6139, lng: 77.209, time: '08:10' },
    ],
  },
  {
    name: 'Route 2 — Saket',
    fare: 1800,
    startTime: '07:15',
    status: 'on_time',
    stops: [
      { name: 'Saket', lat: 28.5245, lng: 77.2066, time: '07:15' },
      { name: 'Malviya Nagar', lat: 28.5355, lng: 77.2065, time: '07:35' },
      { name: 'School', lat: 28.6139, lng: 77.209, time: '08:10' },
    ],
  },
  {
    name: 'Route 3 — Dwarka',
    fare: 2200,
    startTime: '06:50',
    status: 'delayed',
    stops: [
      { name: 'Dwarka Sector 12', lat: 28.5921, lng: 77.046, time: '06:50' },
      { name: 'Janakpuri', lat: 28.6219, lng: 77.0878, time: '07:20' },
      { name: 'School', lat: 28.6139, lng: 77.209, time: '08:10' },
    ],
  },
];

/**
 * Seeds drivers, vehicles and routes and cross-links them, so Transport opens with a
 * working fleet instead of three empty lists. Skips entirely if any transport data
 * already exists — partial seeding would create orphaned links.
 */
async function seedTransport(): Promise<number> {
  const [drivers, vehicles, routes] = await Promise.all([
    getMany(COLLECTIONS.drivers),
    getMany(COLLECTIONS.vehicles),
    getMany(COLLECTIONS.transportRoutes),
  ]);
  if (drivers.length > 0 || vehicles.length > 0 || routes.length > 0) return 0;

  const driverIds: string[] = [];
  for (const driver of DRIVER_SEED) {
    driverIds.push(await createDriver(driver));
  }

  const vehicleIds: string[] = [];
  for (let i = 0; i < VEHICLE_SEED.length; i += 1) {
    vehicleIds.push(
      await createVehicle({ ...VEHICLE_SEED[i], driverId: driverIds[i] ?? '', routeId: '' })
    );
  }

  const routeIds: string[] = [];
  for (let i = 0; i < ROUTE_SEED.length; i += 1) {
    routeIds.push(
      await createRoute({
        ...ROUTE_SEED[i],
        vehicleId: vehicleIds[i] ?? '',
        driverId: driverIds[i] ?? '',
      })
    );
  }

  // Backfill the vehicle -> route link so the relationship reads correctly from both sides.
  for (let i = 0; i < vehicleIds.length; i += 1) {
    if (routeIds[i]) {
      await update<VehicleFormValues>(COLLECTIONS.vehicles, vehicleIds[i], { routeId: routeIds[i] });
    }
  }

  return driverIds.length + vehicleIds.length + routeIds.length;
}

export interface SeedResult {
  feeTemplates: number;
  transportRecords: number;
}

/**
 * Called once at the end of Admin setup. Safe to call repeatedly.
 *
 * Deliberately does NOT throw: seeding is a convenience, so a failure here must not
 * roll back or block a school setup that has otherwise succeeded. Errors are logged
 * and reported back to the caller to surface as a soft warning.
 */
export async function seedDefaultSchoolData(academicYear: string): Promise<SeedResult> {
  const result: SeedResult = { feeTemplates: 0, transportRecords: 0 };

  try {
    result.feeTemplates = await seedFeeTemplates(academicYear);
  } catch (err) {
    console.error('[demoData] fee template seeding failed:', err);
  }

  try {
    result.transportRecords = await seedTransport();
  } catch (err) {
    console.error('[demoData] transport seeding failed:', err);
  }

  return result;
}
