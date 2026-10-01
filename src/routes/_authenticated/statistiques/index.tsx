import { createFileRoute } from '@tanstack/react-router'
import { Statistiques } from '@/features/statistiques'

export const Route = createFileRoute('/_authenticated/statistiques/')({
  component: Statistiques,
})
