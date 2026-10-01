import { createFileRoute } from '@tanstack/react-router'
import { PageAffectation } from '@/features/organisateur/affectation'

export const Route = createFileRoute('/organisateur/affectation')({
  component: PageAffectation,
})
