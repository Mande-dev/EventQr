import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type ProprietesFab = {
  libelle: string
  onClick: () => void
  className?: string
  visible?: boolean
}

/** Bouton d'action flottante (mobile). */
export function BoutonActionFlottant({
  libelle,
  onClick,
  className,
  visible = true,
}: ProprietesFab) {
  if (!visible) return null

  return (
    <Button
      type='button'
      size='lg'
      onClick={onClick}
      aria-label={libelle}
      className={cn(
        'fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-md md:hidden',
        'bg-primary text-primary-foreground hover:bg-principal-hover',
        className
      )}
    >
      <Plus className='size-6' />
      <span className='sr-only'>{libelle}</span>
    </Button>
  )
}

type ProprietesLienFab = {
  libelle: string
  to: string
  className?: string
  visible?: boolean
}

/** FAB navigant vers une route. */
export function LienActionFlottant({
  libelle,
  to,
  className,
  visible = true,
}: ProprietesLienFab) {
  if (!visible) return null
  return (
    <Button
      asChild
      size='lg'
      aria-label={libelle}
      className={cn(
        'fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-md md:hidden',
        'bg-primary text-primary-foreground hover:bg-principal-hover',
        className
      )}
    >
      <Link to={to}>
        <Plus className='size-6' />
        <span className='sr-only'>{libelle}</span>
      </Link>
    </Button>
  )
}
