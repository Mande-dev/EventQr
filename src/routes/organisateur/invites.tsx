import { createFileRoute } from '@tanstack/react-router'
import { PageInvites } from '@/features/organisateur/invites'

export const Route = createFileRoute('/organisateur/invites')({
  component: PageInvites,
})
