import { createFileRoute } from '@tanstack/react-router'
import { PageInvitationModele } from '@/features/organisateur/invitation'

export const Route = createFileRoute('/organisateur/invitation')({
  component: PageInvitationModele,
})
