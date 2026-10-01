import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ProprietesSquelettePage = {
  lignes?: number
  className?: string
}

// Affiche des squelettes de chargement pour une page.
export function SquelettePage({
  lignes = 4,
  className,
}: ProprietesSquelettePage) {
  return (
    <div className={cn('space-y-4', className)} aria-busy='true'>
      <Skeleton className='h-8 w-48' />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-28 w-full rounded-xl' />
        ))}
      </div>
      {Array.from({ length: lignes }).map((_, index) => (
        <Skeleton key={`ligne-${index}`} className='h-12 w-full rounded-lg' />
      ))}
    </div>
  )
}
