import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ProprietesEtatErreur = {
  message?: string
  onReessayer?: () => void
  className?: string
}

// Affiche un état d'erreur avec option de nouvel essai.
export function EtatErreur({
  message = 'Une erreur est survenue lors du chargement.',
  onReessayer,
  className,
}: ProprietesEtatErreur) {
  return (
    <div
      className={cn(
        'flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center',
        className
      )}
      role='alert'
    >
      <AlertCircle className='size-10 text-destructive' aria-hidden />
      <p className='text-sm text-foreground'>{message}</p>
      {onReessayer ? (
        <Button type='button' variant='outline' onClick={onReessayer}>
          Réessayer
        </Button>
      ) : null}
    </div>
  )
}
