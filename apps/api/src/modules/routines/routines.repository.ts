import type { EntityManager, Repository } from 'typeorm'
import type { Page, PaginationQuery } from '../../shared/pagination.js'
import { Client } from '../clients/client.entity.js'
import { Coach } from '../coaches/coach.entity.js'
import { ClientRoutine } from './client-routine.entity.js'
import { Exercise } from './exercise.entity.js'
import { Routine } from './routine.entity.js'
import { RoutineExercise } from './routine-exercise.entity.js'
import { AssignmentStatus } from './routine.enums.js'
import type {
  AssignmentFilters,
  CreateAssignmentInput,
  CreateExerciseInput,
  CreateRoutineExerciseInput,
  CreateRoutineInput,
  RoutineFilters,
  UpdateExerciseInput,
  UpdateRoutineExerciseInput,
  UpdateRoutineInput,
} from './types.js'

export interface RoutinesRepository {
  findExercise(id: number): Promise<Exercise | null>
  findExerciseByName(name: string): Promise<Exercise | null>
  listExercises(query: PaginationQuery): Promise<Page<Exercise>>
  createExercise(input: CreateExerciseInput): Promise<Exercise>
  updateExercise(id: number, input: UpdateExerciseInput): Promise<Exercise>
  findRoutine(id: number): Promise<Routine | null>
  listRoutines(filters: RoutineFilters): Promise<Page<Routine>>
  createRoutine(input: CreateRoutineInput, coachId: number): Promise<Routine>
  updateRoutine(id: number, input: UpdateRoutineInput): Promise<Routine>
  setRoutineActive(id: number, isActive: boolean): Promise<Routine>
  addRoutineExercise(routineId: number, input: CreateRoutineExerciseInput): Promise<RoutineExercise>
  findRoutineExercise(id: number): Promise<RoutineExercise | null>
  updateRoutineExercise(id: number, input: UpdateRoutineExerciseInput): Promise<RoutineExercise>
  deleteRoutineExercise(id: number): Promise<void>
  findClient(id: number): Promise<Client | null>
  findCoach(id: number): Promise<Coach | null>
  findAssignment(id: number): Promise<ClientRoutine | null>
  findActiveAssignment(clientId: number): Promise<ClientRoutine | null>
  listAssignments(filters: AssignmentFilters): Promise<Page<ClientRoutine>>
  createAssignment(input: CreateAssignmentInput & { assignedById: number; clientId: number }): Promise<ClientRoutine>
  updateAssignmentStatus(id: number, status: AssignmentStatus, endDate: string | null): Promise<ClientRoutine>
  withTransaction<T>(work: (repository: RoutinesRepository) => Promise<T>): Promise<T>
}

export class TypeOrmRoutinesRepository implements RoutinesRepository {
  constructor(
    private readonly exerciseRepository: Repository<Exercise>,
    private readonly routineRepository: Repository<Routine>,
    private readonly routineExerciseRepository: Repository<RoutineExercise>,
    private readonly assignmentRepository: Repository<ClientRoutine>,
    private readonly clientRepository: Repository<Client>,
    private readonly coachRepository: Repository<Coach>,
  ) {}

  private fromManager(manager: EntityManager): TypeOrmRoutinesRepository {
    return new TypeOrmRoutinesRepository(
      manager.getRepository(Exercise),
      manager.getRepository(Routine),
      manager.getRepository(RoutineExercise),
      manager.getRepository(ClientRoutine),
      manager.getRepository(Client),
      manager.getRepository(Coach),
    )
  }

  findExercise(id: number): Promise<Exercise | null> {
    return this.exerciseRepository.findOneBy({ id })
  }

  findExerciseByName(name: string): Promise<Exercise | null> {
    return this.exerciseRepository.findOneBy({ name })
  }

  async listExercises(query: PaginationQuery): Promise<Page<Exercise>> {
    const [items, total] = await this.exerciseRepository.findAndCount({
      order: { name: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })
    return { items, page: query.page, limit: query.limit, total }
  }

  createExercise(input: CreateExerciseInput): Promise<Exercise> {
    return this.exerciseRepository.save(this.exerciseRepository.create(input))
  }

  async updateExercise(id: number, input: UpdateExerciseInput): Promise<Exercise> {
    await this.exerciseRepository.update({ id }, input)
    const exercise = await this.findExercise(id)
    if (!exercise) throw new Error('Exercise disappeared during update')
    return exercise
  }

  findRoutine(id: number): Promise<Routine | null> {
    return this.routineRepository.findOne({
      where: { id },
      relations: { creator: true, exercises: { exercise: true } },
    })
  }

  async listRoutines(filters: RoutineFilters): Promise<Page<Routine>> {
    const [items, total] = await this.routineRepository.findAndCount({
      where: {
        ...(filters.includeInactive ? {} : { isActive: true }),
        ...(filters.coachId ? { createdById: filters.coachId } : {}),
      },
      relations: { creator: true, exercises: { exercise: true } },
      order: { id: 'ASC' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    })
    return { items, page: filters.page, limit: filters.limit, total }
  }

  async createRoutine(input: CreateRoutineInput, coachId: number): Promise<Routine> {
    return this.routineRepository.manager.transaction(async (manager) => {
      const routine = await manager.save(manager.create(Routine, {
        name: input.name,
        description: input.description ?? null,
        level: input.level,
        createdById: coachId,
        isActive: true,
      }))
      if (input.exercises?.length) {
        await manager.save(RoutineExercise, input.exercises.map((exercise) => manager.create(RoutineExercise, {
          ...exercise,
          routineId: routine.id,
          weightKg: exercise.weightKg?.toString() ?? null,
          restSeconds: exercise.restSeconds ?? null,
          notes: exercise.notes ?? null,
        })))
      }
      const result = await this.fromManager(manager).findRoutine(routine.id)
      if (!result) throw new Error('Routine disappeared during creation')
      return result
    })
  }

  async updateRoutine(id: number, input: UpdateRoutineInput): Promise<Routine> {
    await this.routineRepository.update({ id }, input)
    const routine = await this.findRoutine(id)
    if (!routine) throw new Error('Routine disappeared during update')
    return routine
  }

  async setRoutineActive(id: number, isActive: boolean): Promise<Routine> {
    await this.routineRepository.update({ id }, { isActive })
    const routine = await this.findRoutine(id)
    if (!routine) throw new Error('Routine disappeared during status update')
    return routine
  }

  addRoutineExercise(routineId: number, input: CreateRoutineExerciseInput): Promise<RoutineExercise> {
    return this.routineExerciseRepository.save(this.routineExerciseRepository.create({
      ...input,
      routineId,
      weightKg: input.weightKg?.toString() ?? null,
      restSeconds: input.restSeconds ?? null,
      notes: input.notes ?? null,
    }))
  }

  findRoutineExercise(id: number): Promise<RoutineExercise | null> {
    return this.routineExerciseRepository.findOne({ where: { id }, relations: { exercise: true } })
  }

  async updateRoutineExercise(id: number, input: UpdateRoutineExerciseInput): Promise<RoutineExercise> {
    await this.routineExerciseRepository.update(id, {
      ...input,
      weightKg: input.weightKg === undefined ? undefined : input.weightKg?.toString() ?? null,
    })
    const item = await this.findRoutineExercise(id)
    if (!item) throw new Error('Routine exercise disappeared during update')
    return item
  }

  async deleteRoutineExercise(id: number): Promise<void> {
    await this.routineExerciseRepository.delete(id)
  }

  findClient(id: number): Promise<Client | null> {
    return this.clientRepository.findOneBy({ id })
  }

  findCoach(id: number): Promise<Coach | null> {
    return this.coachRepository.findOneBy({ id })
  }

  findAssignment(id: number): Promise<ClientRoutine | null> {
    return this.assignmentRepository.findOne({
      where: { id },
      relations: { client: true, routine: { exercises: { exercise: true } }, assignedBy: true },
    })
  }

  findActiveAssignment(clientId: number): Promise<ClientRoutine | null> {
    return this.assignmentRepository.findOneBy({ clientId, status: AssignmentStatus.ACTIVE })
  }

  async listAssignments(filters: AssignmentFilters): Promise<Page<ClientRoutine>> {
    const [items, total] = await this.assignmentRepository.findAndCount({
      where: {
        ...(filters.clientId ? { clientId: filters.clientId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      relations: { client: true, routine: true, assignedBy: true },
      order: { startDate: 'DESC', id: 'DESC' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    })
    return { items, page: filters.page, limit: filters.limit, total }
  }

  createAssignment(input: CreateAssignmentInput & { assignedById: number; clientId: number }): Promise<ClientRoutine> {
    return this.assignmentRepository.save(this.assignmentRepository.create({
      ...input,
      endDate: input.endDate ?? null,
      notes: input.notes ?? null,
      status: AssignmentStatus.ACTIVE,
    }))
  }

  async updateAssignmentStatus(id: number, status: AssignmentStatus, endDate: string | null): Promise<ClientRoutine> {
    await this.assignmentRepository.update({ id }, { status, endDate })
    const assignment = await this.findAssignment(id)
    if (!assignment) throw new Error('Assignment disappeared during status update')
    return assignment
  }

  withTransaction<T>(work: (repository: RoutinesRepository) => Promise<T>): Promise<T> {
    return this.assignmentRepository.manager.transaction((manager) => work(this.fromManager(manager)))
  }
}
