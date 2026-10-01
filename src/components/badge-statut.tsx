import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export type VarianteBadgeStatut =
  | 'present'
  | 'absent'
  | 'attention'
  | 'invalide'
  | 'info'
  | 'actif'
  | 'inactif'

type ProprietesBadgeStatut = {
  variante: VarianteBadgeStatut
  libelle?: string
  className?: string
}

const STYLES: Record<VarianteBadgeStatut, string> = {
  present: 'bg-succes/15 text-succes border-succes/30',
  actif: 'bg-succes/15 text-succes border-succes/30',
  absent: 'bg-muted text-muted-foreground border-border',
  inactif: 'bg-muted text-muted-foreground border-border',
  attention: 'bg-attention/15 text-attention border-attention/30',
  invalide: 'bg-destructive/15 text-destructive border-destructive/30',
  info: 'bg-information/15 text-information border-information/30',
}

const LIBELLES: Record<VarianteBadgeStatut, string> = {
  present: 'Présent',
  absent: 'Absent',
  attention: 'Attention',
  invalide: 'Invalide',
  info: 'Info',
  actif: 'Actif',
  inactif: 'Inactif',
}

// Affiche un badge de statut aux couleurs de la charte EventQR.
export function BadgeStatut({
  variante,
  libelle,
  className,
}: ProprietesBadgeStatut) {
  return (
    <Badge
      variant='outline'
      className={cn('font-medium', STYLES[variante], className)}
    >
      {libelle ?? LIBELLES[variante]}
    </Badge>
  )
}
