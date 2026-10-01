import { createFileRoute } from '@tanstack/react-router'
import { PagePresences } from '@/features/organisateur/presences'

export const Route = createFileRoute('/organisateur/presences')({
  component: PagePresences,
})
