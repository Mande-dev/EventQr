import { useEffect } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useAuthentification } from '@/hooks/use-authentification'
import { demanderConfirmation, afficherSucces } from '@/lib/alertes'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Demande confirmation SweetAlert puis déconnecte le super administrateur.
export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const deconnecter = useAuthentification((etat) => etat.deconnecter)

  useEffect(() => {
    if (!open) return

    let annule = false

    // Lance la confirmation centrée dès l'ouverture demandée.
    const confirmerPuisDeconnecter = async () => {
      const confirme = await demanderConfirmation({
        titre: 'Se déconnecter ?',
        texte:
          'Vous devrez vous reconnecter pour accéder à l’espace Super Administrateur EventQR.',
        boutonConfirmer: 'Se déconnecter',
        boutonAnnuler: 'Annuler',
        destructif: true,
        icone: 'warning',
      })

      if (annule) return
      onOpenChange(false)

      if (!confirme) return

      await deconnecter()
      await afficherSucces('Déconnexion réussie', 'À bientôt sur EventQR.')
      navigate({
        to: '/connexion',
        search: { redirect: location.href },
        replace: true,
      })
    }

    void confirmerPuisDeconnecter()

    return () => {
      annule = true
    }
  }, [open, onOpenChange, deconnecter, navigate, location.href])

  return null
}
