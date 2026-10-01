import { Link } from '@tanstack/react-router'
import { QrCode, LogOut } from 'lucide-react'
import { useAuthentification } from '@/hooks/use-authentification'
import { Button } from '@/components/ui/button'
import { Logo } from '@/assets/logo'
import { demanderConfirmation } from '@/lib/alertes'
import { useNavigate } from '@tanstack/react-router'

/** Page provisoire de l'espace agent de contrôle. */
export function PageAgentProvisoire() {
  const utilisateur = useAuthentification((e) => e.utilisateur)
  const deconnecter = useAuthentification((e) => e.deconnecter)
  const navigate = useNavigate()

  // Déconnecte l'agent après confirmation.
  const seDeconnecter = async () => {
    const ok = await demanderConfirmation({
      titre: 'Se déconnecter ?',
      texte: 'Vous quitterez l’espace agent.',
    })
    if (!ok) return
    await deconnecter()
    void navigate({ to: '/connexion' })
  }

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4'>
      <Logo className='h-12 w-auto' />
      <div className='flex max-w-md flex-col items-center gap-3 text-center'>
        <div className='flex size-16 items-center justify-center rounded-xl bg-accent text-primary'>
          <QrCode className='size-8' aria-hidden />
        </div>
        <h1 className='text-2xl font-semibold text-primary'>
          Espace agent de contrôle
        </h1>
        <p className='text-sm text-muted-foreground'>
          Bonjour{' '}
          {utilisateur
            ? `${utilisateur.prenom} ${utilisateur.nom}`
            : 'agent'}
          . Le scanner QR et le contrôle des entrées seront disponibles dans
          une prochaine étape.
        </p>
      </div>
      <div className='flex flex-wrap items-center justify-center gap-3'>
        <Button type='button' variant='outline' onClick={() => void seDeconnecter()}>
          <LogOut className='size-4' />
          Se déconnecter
        </Button>
        <Button asChild variant='ghost'>
          <Link to='/connexion'>Retour connexion</Link>
        </Button>
      </div>
    </div>
  )
}
