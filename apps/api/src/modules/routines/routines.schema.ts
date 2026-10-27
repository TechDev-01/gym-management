import { z } from 'zod'
import { AssignmentStatus, MuscleGroup, RoutineLevel } from './routine.enums.js'

const idSchema = z.coerce.number().int().positive()
const nullableText = z.string().trim().min(1).nullable().optional()
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')

export const routineIdSchema = z.object({ id: idSchema }).strict()
export const routineExerciseIdSchema = z.object({ id: idSchema, routineExerciseId: idSchema }).strict()
export const exerciseIdSchema = z.object({ id: idSchema }).strict()

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  muscleGroup: z.nativeEnum(MuscleGroup),
  equipment: nullableText,
  description: nullableText,
}).strict()

export const updateExerciseSchema = createExerciseSchema.partial()

const routineExerciseFields = {
  exerciseId: idSchema,
  dayNumber: z.number().int().positive(),
  position: z.number().int().positive(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().nonnegative().nullable().optional(),
  restSeconds: z.number().int().nonnegative().nullable().optional(),
  notes: nullableText,
}

export const createRoutineExerciseSchema = z.object(routineExerciseFields).strict()
export const updateRoutineExerciseSchema = createRoutineExerciseSchema.partial()

export const createRoutineSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: nullableText,
  level: z.nativeEnum(RoutineLevel),
  createdById: idSchema.optional(),
  exercises: z.array(createRoutineExerciseSchema).optional(),
}).strict()

export const updateRoutineSchema = createRoutineSchema.omit({ exercises: true }).partial()

export const createAssignmentSchema = z.object({
  clientId: idSchema.optional(),
  routineId: idSchema,
  assignedById: idSchema.optional(),
  startDate: dateSchema,
  endDate: dateSchema.nullable().optional(),
  notes: nullableText,
}).strict().refine((value) => !value.endDate || value.endDate >= value.startDate, {
  message: 'endDate must be on or after startDate',
  path: ['endDate'],
})

export const assignmentQuerySchema = z.object({
  clientId: idSchema.optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
}).strict()

export const routineQuerySchema = z.object({
  includeInactive: z.enum(['true', 'false']).transform((value) => value === 'true').default(false),
}).strict()

export const assignmentStatusSchema = z.object({
  status: z.enum([AssignmentStatus.COMPLETED, AssignmentStatus.CANCELLED]),
}).strict()

export const routineStatusSchema = z.object({
  isActive: z.boolean(),
}).strict()
