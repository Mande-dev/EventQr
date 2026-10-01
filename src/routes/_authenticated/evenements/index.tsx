import { createFileRoute } from '@tanstack/react-router'
import { Evenements } from '@/features/evenements'

export const Route = createFileRoute('/_authenticated/evenements/')({
  component: Evenements,
})
