import { Link } from '@tanstack/react-router'
import { Logo } from '@/assets/logo'
import { cn } from '@/lib/utils'

type ProprietesPiedDePage = React.ComponentProps<'footer'>

// Pied de page EventQR : toujours après le contenu, en bas de la zone scrollable.
export function Footer({ className, ...props }: ProprietesPiedDePage) {
  const annee = new Date().getFullYear()

  return (
    <footer
      className={cn(
        'mt-auto shrink-0 border-t border-border bg-background px-4 py-5',
        className
      )}
      {...props}
    >
      <div className='mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row'>
        <div className='flex flex-col items-center gap-2 sm:flex-row sm:gap-3'>
          <Logo variante='icone' className='size-8' />
          <p className='text-center text-sm text-muted-foreground sm:text-start'>
            © {annee} EventQR — Super Administrateur
          </p>
        </div>
        <nav
          className='flex flex-wrap items-center justify-center gap-4 text-sm'
          aria-label='Liens du pied de page'
        >
          <Link
            to='/parametres'
            className='inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-lien'
          >
            Paramètres
          </Link>
          <Link
            to='/profil'
            className='inline-flex min-h-11 items-center text-muted-foreground transition-colors hover:text-lien'
          >
            Profil
          </Link>
        </nav>
      </div>
    </footer>
  )
}
