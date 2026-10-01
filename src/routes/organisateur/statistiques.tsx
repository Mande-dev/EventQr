import { createFileRoute } from '@tanstack/react-router'
import { PageStatistiquesOrganisateur } from '@/features/organisateur/statistiques'

export const Route = createFileRoute('/organisateur/statistiques')({
  component: PageStatistiquesOrganisateur,
})
