import { createFileRoute } from '@tanstack/react-router'
import { PageMesEvenements } from '@/features/organisateur/evenements'

export const Route = createFileRoute('/organisateur/evenements')({
  component: PageMesEvenements,
})
