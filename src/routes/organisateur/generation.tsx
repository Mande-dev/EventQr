import { createFileRoute } from '@tanstack/react-router'
import { PageGenerationInvitations } from '@/features/organisateur/generation'

export const Route = createFileRoute('/organisateur/generation')({
  component: PageGenerationInvitations,
})
