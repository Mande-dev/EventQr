import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { cn } from '@/lib/utils'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '../ui/button'

type ProprietesAppTitle = {
  /** Route cible du logo (défaut : accueil Super Admin). */
  cheminAccueil?: '/' | '/organisateur'
}

// Affiche le titre EventQR (logo) dans l'en-tête de la sidebar.
export function AppTitle({ cheminAccueil = '/' }: ProprietesAppTitle) {
  const { setOpenMobile, state } = useSidebar()
  const estReduit = state === 'collapsed'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='gap-2 py-2 hover:bg-sidebar-accent/50 active:bg-sidebar-accent'
          asChild
        >
          <div className='flex w-full items-center gap-2'>
            <Link
              to={cheminAccueil}
              onClick={() => setOpenMobile(false)}
              className='flex min-h-11 flex-1 items-center gap-2 overflow-hidden'
            >
              <Logo
                variante={estReduit ? 'icone' : 'complet'}
                surFondSombre
                className={cn(
                  estReduit ? 'size-9' : 'h-10 w-auto max-w-[170px]'
                )}
              />
            </Link>
            <ToggleSidebar />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

// Bascule l'ouverture de la sidebar (menu burger / fermeture).
function ToggleSidebar({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar='trigger'
      data-slot='sidebar-trigger'
      variant='ghost'
      size='icon'
      className={cn(
        'aspect-square size-11 min-h-11 min-w-11 text-sidebar-foreground max-md:scale-100',
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <X className='md:hidden' />
      <Menu className='max-md:hidden' />
      <span className='sr-only'>Basculer le menu</span>
    </Button>
  )
}
