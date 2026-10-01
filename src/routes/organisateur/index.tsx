import { createFileRoute } from '@tanstack/react-router'
import { TableauDeBordOrganisateur } from '@/features/organisateur/tableau-de-bord'

export const Route = createFileRoute('/organisateur/')({
  component: TableauDeBordOrganisateur,
})
