import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

type ProprietesCarteStatistique = {
  titre: string
  valeur: string | number
  description?: string
  icone?: LucideIcon
  className?: string
}

// Affiche une carte de statistique pour le tableau de bord.
export function CarteStatistique({
  titre,
  valeur,
  description,
  icone: Icone,
  className,
}: ProprietesCarteStatistique) {
  return (
    <Card
      className={cn(
        'overflow-hidden border-border/80 shadow-none transition-shadow hover:shadow-sm',
        className
      )}
    >
      <CardContent className='flex items-start gap-4 p-5'>
        {Icone ? (
          <div
            className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'
            aria-hidden
          >
            <Icone className='size-5' />
          </div>
        ) : null}
        <div className='min-w-0 flex-1 space-y-1'>
          <p className='text-sm font-medium text-muted-foreground'>{titre}</p>
          <p className='text-2xl font-bold tracking-tight text-foreground'>
            {valeur}
          </p>
          {description ? (
            <p className='text-xs text-texte-discret'>{description}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
