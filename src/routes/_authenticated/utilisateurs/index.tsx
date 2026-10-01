import { createFileRoute } from '@tanstack/react-router'
import { PageUtilisateurs } from '@/features/utilisateurs'

export const Route = createFileRoute('/_authenticated/utilisateurs/')({
  component: PageUtilisateurs,
})
