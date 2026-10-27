import { ConflictError } from '../../shared/errors/conflict.error.js'
import { ForbiddenError } from '../../shared/errors/forbidden.error.js'
import { NotFoundError } from '../../shared/errors/not-found.error.js'
import type { ClientRoutine } from './client-routine.entity.js'
import { AssignmentStatus } from './routine.enums.js'
import type { Exercise } from './exercise.entity.js'
import type { Routine } from './routine.entity.js'
import type { RoutineExercise } from './routine-exercise.entity.js'
import type { RoutinesRepository } from './routines.repository.js'
import {
  assignmentQuerySchema,
  assignmentStatusSchema,
  createAssignmentSchema,
  createExerciseSchema,
  createRoutineExerciseSchema,
  createRoutineSchema,
  exerciseIdSchema,
  routineExerciseIdSchema,
  routineIdSchema,
  routineQuerySchema,
  routineStatusSchema,
  updateExerciseSchema,
  updateRoutineExerciseSchema,
  updateRoutineSchema,
} from './routines.schema.js'
import type { UserContext } from './types.js'
import { NotificationService } from '../../jobs/services.js'

export class RoutinesService {
  constructor(
    private readonly repository: RoutinesRepository,
    private readonly notificationService = new NotificationService(),
  ) {}

  async listExercises(): Promise<Exercise[]> { return this.repository.listExercises() }

  async getExercise(inputId: unknown): Promise<Exercise> {
    const { id } = exerciseIdSchema.parse({ id: inputId })
    const exercise = await this.repository.findExercise(id)
    if (!exercise) throw new NotFoundError('Exercise not found')
    return exercise
  }

  async createExercise(input: unknown): Promise<Exercise> {
    const data = createExerciseSchema.parse(input)
    if (await this.repository.findExerciseByName(data.name)) throw new ConflictError('Exercise name is already registered')
    return this.repository.createExercise(data)
  }

  async updateExercise(inputId: unknown, input: unknown): Promise<Exercise> {
    const { id } = exerciseIdSchema.parse({ id: inputId })
    const data = updateExerciseSchema.parse(input)
    const existing = await this.repository.findExercise(id)
    if (!existing) throw new NotFoundError('Exercise not found')
    if (data.name && data.name !== existing.name && await this.repository.findExerciseByName(data.name)) {
      throw new ConflictError('Exercise name is already registered')
    }
    return this.repository.updateExercise(id, data)
  }

  async listRoutines(input: unknown, user: UserContext): Promise<Routine[]> {
    const query = routineQuerySchema.parse(input)
    return this.repository.listRoutines({
      includeInactive: query.includeInactive && user.role === 'ADMIN',
      coachId: user.role === 'COACH' ? user.coachId ?? -1 : undefined,
    })
  }

  async getRoutine(inputId: unknown, user: UserContext): Promise<Routine> {
    const { id } = routineIdSchema.parse({ id: inputId })
    const routine = await this.repository.findRoutine(id)
    if (!routine || (!routine.isActive && user.role !== 'ADMIN')) throw new NotFoundError('Routine not found')
    return routine
  }

  async createRoutine(input: unknown, user: UserContext): Promise<Routine> {
    const data = createRoutineSchema.parse(input)
    const coachId = user.role === 'COACH' ? user.coachId : data.createdById
    if (!coachId) throw new ConflictError('A coach is required to create a routine')
    if (!await this.repository.findCoach(coachId)) throw new NotFoundError('Coach not found')
    await this.ensureExercisesExist(data.exercises)
    return this.repository.createRoutine(data, coachId)
  }

  async updateRoutine(inputId: unknown, input: unknown, user: UserContext): Promise<Routine> {
    const { id } = routineIdSchema.parse({ id: inputId })
    const data = updateRoutineSchema.parse(input)
    const routine = await this.requireRoutine(id)
    this.assertRoutineOwnership(routine, user)
    if (!routine.isActive) throw new ConflictError('Inactive routines cannot be modified')
    return this.repository.updateRoutine(id, data)
  }

  async setRoutineStatus(inputId: unknown, isActive: boolean, user: UserContext): Promise<Routine> {
    const { id } = routineIdSchema.parse({ id: inputId })
    const routine = await this.requireRoutine(id)
    this.assertRoutineOwnership(routine, user)
    return this.repository.setRoutineActive(id, isActive)
  }

  async addRoutineExercise(inputId: unknown, input: unknown, user: UserContext): Promise<RoutineExercise> {
    const { id } = routineIdSchema.parse({ id: inputId })
    const data = createRoutineExerciseSchema.parse(input)
    const routine = await this.requireRoutine(id)
    this.assertRoutineOwnership(routine, user)
    if (!routine.isActive) throw new ConflictError('Inactive routines cannot be modified')
    await this.ensureExerciseExists(data.exerciseId)
    return this.repository.addRoutineExercise(id, data)
  }

  async updateRoutineExercise(input: unknown, body: unknown, user: UserContext): Promise<RoutineExercise> {
    const { routineExerciseId } = routineExerciseIdSchema.parse(input)
    const data = updateRoutineExerciseSchema.parse(body)
    const item = await this.requireRoutineExercise(routineExerciseId)
    const routine = await this.requireRoutine(item.routineId)
    this.assertRoutineOwnership(routine, user)
    if (!routine.isActive) throw new ConflictError('Inactive routines cannot be modified')
    if (data.exerciseId) await this.ensureExerciseExists(data.exerciseId)
    return this.repository.updateRoutineExercise(routineExerciseId, data)
  }

  async deleteRoutineExercise(input: unknown, user: UserContext): Promise<void> {
    const { routineExerciseId } = routineExerciseIdSchema.parse(input)
    const item = await this.requireRoutineExercise(routineExerciseId)
    const routine = await this.requireRoutine(item.routineId)
    this.assertRoutineOwnership(routine, user)
    if (!routine.isActive) throw new ConflictError('Inactive routines cannot be modified')
    await this.repository.deleteRoutineExercise(routineExerciseId)
  }

  async listAssignments(input: unknown, user: UserContext): Promise<ClientRoutine[]> {
    const query = assignmentQuerySchema.parse(input)
    return this.repository.listAssignments({
      clientId: user.role === 'CLIENT' ? user.clientId ?? -1 : query.clientId,
      status: query.status,
    })
  }

  async getAssignment(inputId: unknown, user: UserContext): Promise<ClientRoutine> {
    const { id } = routineIdSchema.parse({ id: inputId })
    const assignment = await this.repository.findAssignment(id)
    if (!assignment) throw new NotFoundError('Routine assignment not found')
    this.assertClientAccess(assignment.clientId, user)
    return assignment
  }

  async createAssignment(input: unknown, user: UserContext): Promise<ClientRoutine> {
    const data = createAssignmentSchema.parse(input)
    const clientId = user.role === 'CLIENT' ? user.clientId : data.clientId
    if (!clientId) throw new ConflictError('clientId is required')
    if (user.role === 'CLIENT' && data.clientId && data.clientId !== user.clientId) throw new ForbiddenError()
    const [client, routine] = await Promise.all([
      this.repository.findClient(clientId),
      this.repository.findRoutine(data.routineId),
    ])
    if (!client || !client.isActive) throw new NotFoundError('Active client not found')
    if (!routine || !routine.isActive) throw new NotFoundError('Active routine not found')
    if (await this.repository.findActiveAssignment(clientId)) throw new ConflictError('Client already has an active routine')
    const assignedById = user.role === 'COACH' ? this.requireCoachId(user) : data.assignedById
    if (!assignedById) throw new ConflictError('assignedById is required for an admin assignment')
    if (!await this.repository.findCoach(assignedById)) throw new NotFoundError('Coach not found')
    const assignment = await this.repository.createAssignment({ ...data, clientId, assignedById })
    await this.notificationService.enqueue(
      {
        type: 'routine-assigned',
        payload: {
          assignmentId: assignment.id,
          clientId: assignment.clientId,
          routineId: assignment.routineId,
        },
      },
      `routine-assigned-${assignment.id}`,
    )
    return assignment
  }

  async updateAssignmentStatus(inputId: unknown, input: unknown, user: UserContext): Promise<ClientRoutine> {
    const { id } = routineIdSchema.parse({ id: inputId })
    const { status } = assignmentStatusSchema.parse(input)
    const assignment = await this.getAssignment(id, user)
    if (assignment.status !== AssignmentStatus.ACTIVE) throw new ConflictError('Only active assignments can change status')
    return this.repository.updateAssignmentStatus(id, status, assignment.endDate ?? new Date().toISOString().slice(0, 10))
  }

  private async ensureExercisesExist(exercises: { exerciseId: number }[] | undefined): Promise<void> {
    for (const exercise of exercises ?? []) await this.ensureExerciseExists(exercise.exerciseId)
  }

  private async ensureExerciseExists(id: number): Promise<void> {
    if (!await this.repository.findExercise(id)) throw new NotFoundError('Exercise not found')
  }

  private async requireRoutine(id: number): Promise<Routine> {
    const routine = await this.repository.findRoutine(id)
    if (!routine) throw new NotFoundError('Routine not found')
    return routine
  }

  private async requireRoutineExercise(id: number): Promise<RoutineExercise> {
    const item = await this.repository.findRoutineExercise(id)
    if (!item) throw new NotFoundError('Routine exercise not found')
    return item
  }

  private assertRoutineOwnership(routine: Routine, user: UserContext): void {
    if (user.role !== 'ADMIN' && user.coachId !== routine.createdById) throw new ForbiddenError()
  }

  private assertClientAccess(clientId: number, user: UserContext): void {
    if (user.role === 'CLIENT' && user.clientId !== clientId) throw new ForbiddenError()
  }

  private requireCoachId(user: UserContext): number {
    if (!user.coachId) throw new ForbiddenError('A coach account is required')
    return user.coachId
  }
}
