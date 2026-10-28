import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient, getClient, getClients, updateClient } from './api'
import { getClientAttendance, getClientProgress, getClientSubscriptions } from './summary'
import type { ClientInput, ClientUpdateInput } from './types'

export const clientsQueryKey = ['clients'] as const

export function useClients() {
  return useQuery({ queryKey: clientsQueryKey, queryFn: getClients })
}

export function useClient(id: number, enabled = true) {
  return useQuery({
    queryKey: [...clientsQueryKey, id],
    queryFn: () => getClient(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ClientInput) => createClient(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientsQueryKey }),
  })
}

export function useUpdateClient(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ClientUpdateInput) => updateClient(id, input),
    onSuccess: (client) => {
      queryClient.setQueryData([...clientsQueryKey, id], client)
      queryClient.invalidateQueries({ queryKey: clientsQueryKey })
    },
  })
}

export function useClientSubscriptions(clientId: number, enabled = true) {
  return useQuery({
    queryKey: ['client-subscriptions', clientId],
    queryFn: () => getClientSubscriptions(clientId),
    enabled: enabled && clientId > 0,
  })
}

export function useClientAttendance(clientId: number, enabled = true) {
  return useQuery({
    queryKey: ['client-attendance', clientId],
    queryFn: () => getClientAttendance(clientId),
    enabled: enabled && clientId > 0,
  })
}

export function useClientProgress(clientId: number, enabled = true) {
  return useQuery({
    queryKey: ['client-progress', clientId],
    queryFn: () => getClientProgress(clientId),
    enabled: enabled && clientId > 0,
  })
}
