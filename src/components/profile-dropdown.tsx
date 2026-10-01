import { Link } from '@tanstack/react-router'
import useDialogState from '@/hooks/use-dialog-state'
import { useAuthentification } from '@/hooks/use-authentification'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'

// Menu profil du header (profil, paramètres, déconnexion).
export function ProfileDropdown() {
  const [ouvert, definirOuvert] = useDialogState()
  const utilisateur = useAuthentification((etat) => etat.utilisateur)

  const estOrganisateur = utilisateur?.role_systeme === 'organisateur'
  const cheminProfil = estOrganisateur ? '/organisateur/profil' : '/profil'

  const initiales = utilisateur
    ? `${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}`
    : 'EQ'
  const nomComplet = utilisateur
    ? `${utilisateur.prenom} ${utilisateur.nom}`
    : 'Utilisateur'

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='relative size-11 min-h-11 min-w-11 rounded-full'
            aria-label='Menu profil'
          >
            <Avatar className='size-9'>
              <AvatarImage src='/avatars/shadcn.jpg' alt={nomComplet} />
              <AvatarFallback>{initiales}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>{nomComplet}</p>
              <p className='text-xs leading-none text-muted-foreground'>
                {utilisateur?.email ?? '—'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to={cheminProfil}>Profil</Link>
            </DropdownMenuItem>
            {!estOrganisateur ? (
              <DropdownMenuItem asChild>
                <Link to='/parametres'>Paramètres</Link>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => definirOuvert(true)}
          >
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!ouvert} onOpenChange={definirOuvert} />
    </>
  )
}
