import { createFileRoute } from '@tanstack/react-router'
import { Profil } from '@/features/profil'

export const Route = createFileRoute('/_authenticated/profil/')({
  component: Profil,
})
