import bcrypt from 'bcrypt'
import { initializeDatabase, AppDataSource } from './config/database.js'
import { AppUser, UserRole } from './modules/auth/app-user.entity.js'
import { Client } from './modules/clients/client.entity.js'
import { Coach } from './modules/coaches/coach.entity.js'
import { CoachSchedule } from './modules/coaches/coach-schedule.entity.js'
import { Membership } from './modules/memberships/membership.entity.js'
import { Subscription, SubscriptionStatus } from './modules/memberships/subscription.entity.js'
import { Payment, PaymentMethod, PaymentStatus } from './modules/payments/payment.entity.js'
import { Attendance } from './modules/attendance/attendance.entity.js'
import { Exercise } from './modules/routines/exercise.entity.js'
import { Routine } from './modules/routines/routine.entity.js'
import { RoutineExercise } from './modules/routines/routine-exercise.entity.js'
import { ClientRoutine } from './modules/routines/client-routine.entity.js'
import { AssignmentStatus, MuscleGroup, RoutineLevel } from './modules/routines/routine.enums.js'
import { ProgressRecord } from './modules/progress/progress-record.entity.js'

export const seedCredentials = {
  admin: { email: 'admin@gym.local', password: 'Admin1234!' },
  reception: { email: 'reception@gym.local', password: 'Reception1234!' },
  coach: { email: 'coach@gym.local', password: 'Coach1234!' },
  client: { email: 'ana.client@gym.local', password: 'Client1234!' },
} as const

async function seed(): Promise<void> {
  await initializeDatabase()

  const clientRepository = AppDataSource.getRepository(Client)
  const coachRepository = AppDataSource.getRepository(Coach)
  const scheduleRepository = AppDataSource.getRepository(CoachSchedule)
  const membershipRepository = AppDataSource.getRepository(Membership)
  const subscriptionRepository = AppDataSource.getRepository(Subscription)
  const paymentRepository = AppDataSource.getRepository(Payment)
  const userRepository = AppDataSource.getRepository(AppUser)
  const attendanceRepository = AppDataSource.getRepository(Attendance)
  const exerciseRepository = AppDataSource.getRepository(Exercise)
  const routineRepository = AppDataSource.getRepository(Routine)
  const routineExerciseRepository = AppDataSource.getRepository(RoutineExercise)
  const clientRoutineRepository = AppDataSource.getRepository(ClientRoutine)
  const progressRepository = AppDataSource.getRepository(ProgressRecord)

  const ana = await findOrCreate(clientRepository, { email: 'ana.client@gym.local' }, {
    name: 'Ana',
    lastName: 'Cliente',
    dni: 'DEMO-1001',
    phone: '+51999900001',
    email: 'ana.client@gym.local',
    stripeCustomerId: null,
    isActive: true,
  })
  const bruno = await findOrCreate(clientRepository, { email: 'bruno.client@gym.local' }, {
    name: 'Bruno',
    lastName: 'Cliente',
    dni: 'DEMO-1002',
    phone: '+51999900002',
    email: 'bruno.client@gym.local',
    stripeCustomerId: null,
    isActive: true,
  })
  const coach = await findOrCreate(coachRepository, { email: 'coach@gym.local' }, {
    name: 'Carlos',
    lastName: 'Entrenador',
    dni: 'DEMO-2001',
    phone: '+51999900003',
    email: 'coach@gym.local',
    isActive: true,
  })

  const standardMembership = await findOrCreate(membershipRepository, { name: 'Plan Estándar Demo' }, {
    name: 'Plan Estándar Demo',
    description: 'Plan de demostración mensual para el flujo académico.',
    durationDays: 30,
    maxDaysPerWeek: 5,
    priceAmount: 3500,
    currency: 'usd',
    stripeProductId: null,
    stripePriceId: null,
    isActive: true,
  })
  const premiumMembership = await findOrCreate(membershipRepository, { name: 'Plan Premium Demo' }, {
    name: 'Plan Premium Demo',
    description: 'Plan de demostración con acceso ilimitado.',
    durationDays: 90,
    maxDaysPerWeek: null,
    priceAmount: 9000,
    currency: 'usd',
    stripeProductId: null,
    stripePriceId: null,
    isActive: true,
  })

  const today = new Date().toISOString().slice(0, 10)
  const endDate = addDays(today, standardMembership.durationDays - 1)
  const anaSubscription = await findOrCreate(subscriptionRepository, {
    clientId: ana.id,
    membershipId: standardMembership.id,
  }, {
    clientId: ana.id,
    membershipId: standardMembership.id,
    status: SubscriptionStatus.ACTIVE,
    startDate: today,
    endDate,
    stripeSubscriptionId: null,
  })
  const brunoSubscription = await findOrCreate(subscriptionRepository, {
    clientId: bruno.id,
    membershipId: premiumMembership.id,
  }, {
    clientId: bruno.id,
    membershipId: premiumMembership.id,
    status: SubscriptionStatus.EXPIRED,
    startDate: addDays(today, -120),
    endDate: addDays(today, -31),
    stripeSubscriptionId: null,
  })

  await findOrCreate(paymentRepository, { subscriptionId: anaSubscription.id }, {
    clientId: ana.id,
    subscriptionId: anaSubscription.id,
    method: PaymentMethod.CASH,
    status: PaymentStatus.SUCCEEDED,
    amount: standardMembership.priceAmount,
    currency: standardMembership.currency,
    refundedAmount: 0,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    stripeInvoiceId: null,
    receiptUrl: null,
    recordedById: null,
    paidAt: new Date(),
  })
  await findOrCreate(paymentRepository, { subscriptionId: brunoSubscription.id }, {
    clientId: bruno.id,
    subscriptionId: brunoSubscription.id,
    method: PaymentMethod.TRANSFER,
    status: PaymentStatus.SUCCEEDED,
    amount: premiumMembership.priceAmount,
    currency: premiumMembership.currency,
    refundedAmount: 0,
    stripeCheckoutSessionId: null,
    stripePaymentIntentId: null,
    stripeInvoiceId: null,
    receiptUrl: null,
    recordedById: null,
    paidAt: new Date(),
  })

  await findOrCreate(scheduleRepository, {
    coachId: coach.id,
    dayOfWeek: 1,
    startTime: '08:00',
  }, {
    coachId: coach.id,
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '16:00',
  })

  const squat = await findOrCreate(exerciseRepository, { name: 'Sentadilla con barra' }, {
    name: 'Sentadilla con barra',
    muscleGroup: MuscleGroup.LEGS,
    equipment: 'Barra',
    description: 'Ejercicio compuesto para tren inferior.',
  })
  const benchPress = await findOrCreate(exerciseRepository, { name: 'Press de banca' }, {
    name: 'Press de banca',
    muscleGroup: MuscleGroup.CHEST,
    equipment: 'Banco y barra',
    description: 'Ejercicio compuesto para pectoral.',
  })
  const routine = await findOrCreate(routineRepository, { name: 'Fuerza inicial Demo' }, {
    name: 'Fuerza inicial Demo',
    description: 'Rutina usada para demostrar asignaciones y progreso.',
    level: RoutineLevel.BEGINNER,
    createdById: coach.id,
    isActive: true,
  })

  await findOrCreate(routineExerciseRepository, {
    routineId: routine.id,
    dayNumber: 1,
    position: 1,
  }, {
    routineId: routine.id,
    exerciseId: squat.id,
    dayNumber: 1,
    position: 1,
    sets: 3,
    reps: 10,
    weightKg: '40.00',
    restSeconds: 90,
    notes: 'Mantener técnica controlada.',
  })
  await findOrCreate(routineExerciseRepository, {
    routineId: routine.id,
    dayNumber: 1,
    position: 2,
  }, {
    routineId: routine.id,
    exerciseId: benchPress.id,
    dayNumber: 1,
    position: 2,
    sets: 3,
    reps: 10,
    weightKg: '25.00',
    restSeconds: 90,
    notes: null,
  })

  await findOrCreate(clientRoutineRepository, {
    clientId: ana.id,
    routineId: routine.id,
  }, {
    clientId: ana.id,
    routineId: routine.id,
    assignedById: coach.id,
    status: AssignmentStatus.ACTIVE,
    startDate: today,
    endDate: addDays(today, 30),
    notes: 'Revisar técnica en la primera semana.',
  })

  await findOrCreate(attendanceRepository, {
    clientId: ana.id,
    subscriptionId: anaSubscription.id,
  }, {
    clientId: ana.id,
    subscriptionId: anaSubscription.id,
    checkOutAt: new Date(),
    recordedById: null,
  })
  await findOrCreate(progressRepository, {
    clientId: ana.id,
    measuredAt: addDays(today, -30),
  }, {
    clientId: ana.id,
    recordedById: coach.id,
    measuredAt: addDays(today, -30),
    weightKg: '78.50',
    heightCm: '175.00',
    bodyFatPct: '24.0',
    muscleKg: '34.00',
    chestCm: '98.00',
    waistCm: '88.00',
    hipCm: '100.00',
    armCm: '32.00',
    thighCm: '56.00',
    notes: 'Medición inicial.',
  })
  await findOrCreate(progressRepository, {
    clientId: ana.id,
    measuredAt: today,
  }, {
    clientId: ana.id,
    recordedById: coach.id,
    measuredAt: today,
    weightKg: '76.80',
    heightCm: '175.00',
    bodyFatPct: '22.5',
    muscleKg: '34.80',
    chestCm: '99.00',
    waistCm: '85.00',
    hipCm: '99.00',
    armCm: '33.00',
    thighCm: '57.00',
    notes: 'Seguimiento de demostración.',
  })

  await ensureUser(userRepository, seedCredentials.admin.email, seedCredentials.admin.password, UserRole.ADMIN)
  await ensureUser(userRepository, seedCredentials.reception.email, seedCredentials.reception.password, UserRole.RECEPTION)
  await ensureUser(userRepository, seedCredentials.coach.email, seedCredentials.coach.password, UserRole.COACH, null, coach.id)
  await ensureUser(userRepository, seedCredentials.client.email, seedCredentials.client.password, UserRole.CLIENT, ana.id)

  console.log('Demo seed completed')
  console.log(`Admin: ${seedCredentials.admin.email} / ${seedCredentials.admin.password}`)
  console.log(`Reception: ${seedCredentials.reception.email} / ${seedCredentials.reception.password}`)
  console.log(`Coach: ${seedCredentials.coach.email} / ${seedCredentials.coach.password}`)
  console.log(`Client: ${seedCredentials.client.email} / ${seedCredentials.client.password}`)
}

async function main(): Promise<void> {
  try {
    await seed()
  } catch (error: unknown) {
    console.error('Failed to seed admin user', error)
    process.exitCode = 1
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy()
    }
  }
}

void main()

type EntityRepository<T extends object> = ReturnType<typeof AppDataSource.getRepository<T>>

async function findOrCreate<T extends object>(
  repository: EntityRepository<T>,
  where: Partial<T>,
  values: Partial<T>,
): Promise<T> {
  const existing = await repository.findOne({ where: where as never })
  if (existing) return existing
  return repository.save(repository.create(values as T))
}

async function ensureUser(
  repository: EntityRepository<AppUser>,
  email: string,
  password: string,
  role: UserRole,
  clientId: number | null = null,
  coachId: number | null = null,
): Promise<void> {
  const existing = await repository.findOne({ where: { email } })
  const passwordHash = await bcrypt.hash(password, 12)
  const user = existing ?? repository.create({ email })
  user.passwordHash = passwordHash
  user.role = role
  user.clientId = clientId
  user.coachId = coachId
  user.isActive = true
  user.lastLoginAt = null
  await repository.save(user)
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
