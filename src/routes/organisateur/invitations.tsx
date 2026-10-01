import { createFileRoute } from '@tanstack/react-router'
import { PageInvitations } from '@/features/organisateur/invitations'

export const Route = createFileRoute('/organisateur/invitations')({
  component: PageInvitations,
})
