import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

type ProprietesHeader = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean
  titre?: string
  actions?: React.ReactNode
  ref?: React.Ref<HTMLElement>
}

// Barre d'en-tête sticky : menu, titre de page, actions et outils.
export function Header({
  className,
  fixed = true,
  titre,
  actions,
  children,
  ...props
}: ProprietesHeader) {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    // Suit le défilement de la fenêtre ou du conteneur principal.
    const onScroll = () => {
      const depuisFenetre =
        document.body.scrollTop || document.documentElement.scrollTop
      const conteneur = document.querySelector(
        '[data-slot="sidebar-inset"]'
      ) as HTMLElement | null
      const depuisConteneur = conteneur?.scrollTop ?? 0
      setOffset(Math.max(depuisFenetre, depuisConteneur))
    }

    document.addEventListener('scroll', onScroll, { passive: true })
    const conteneur = document.querySelector('[data-slot="sidebar-inset"]')
    conteneur?.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      document.removeEventListener('scroll', onScroll)
      conteneur?.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <header
      className={cn(
        'z-50 h-16 shrink-0',
        fixed &&
          'header-fixed peer/header sticky top-0 w-full border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80',
        offset > 10 && fixed ? 'shadow-sm' : 'shadow-none',
        className
      )}
      {...props}
    >
      <div className='relative flex h-full min-w-0 items-center gap-2 p-3 sm:gap-3 sm:p-4'>
        <SidebarTrigger variant='outline' className='shrink-0 max-md:scale-125' />
        <Separator orientation='vertical' className='h-6 shrink-0' />

        {titre ? (
          <h1 className='min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-primary sm:text-lg'>
            {titre}
          </h1>
        ) : (
          <div className='min-w-0 flex-1' aria-hidden />
        )}

        {actions ? (
          <div className='flex shrink-0 items-center gap-2'>{actions}</div>
        ) : null}

        {children ? (
          <div className='flex shrink-0 items-center gap-2'>{children}</div>
        ) : null}
      </div>
    </header>
  )
}
