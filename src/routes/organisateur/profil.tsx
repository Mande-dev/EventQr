import { createFileRoute } from '@tanstack/react-router'
import { PageProfilOrganisateur } from '@/features/organisateur/profil'

export const Route = createFileRoute('/organisateur/profil')({
  component: PageProfilOrganisateur,
})
