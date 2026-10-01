import { createFileRoute } from '@tanstack/react-router'
import { PageUtilisateursEvenement } from '@/features/organisateur/utilisateurs-evenement'

export const Route = createFileRoute('/organisateur/utilisateurs')({
  component: PageUtilisateursEvenement,
})
