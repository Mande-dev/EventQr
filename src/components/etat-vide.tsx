import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

type ProprietesEtatVide = {
  titre: string
  description?: string
  className?: string
  action?: React.ReactNode
}

// Affiche un état vide centré lorsqu'aucune donnée n'est disponible.
export function EtatVide({
  titre,
  description,
  className,
  action,
}: ProprietesEtatVide) {
  return (
    <div
      className={cn(
        'flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card p-6 text-center',
        className
      )}
    >
      <Inbox className='size-10 text-texte-discret' aria-hidden />
      <div>
        <p className='font-medium text-foreground'>{titre}</p>
        {description ? (
          <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
