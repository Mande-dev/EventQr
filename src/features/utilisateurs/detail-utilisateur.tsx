import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Power } from 'lucide-react'
import type { Utilisateur } from '@/types'
import {
  afficherErreur,
  afficherSucces,
  demanderConfirmation,
} from '@/lib/alertes'
import {
  basculerStatutUtilisateur,
  obtenirUtilisateur,
} from '@/services/utilisateurs'
import { formaterDate } from '@/lib/formatage'
import { BadgeStatut } from '@/components/badge-statut'
import { EtatErreur } from '@/components/etat-erreur'
import { SquelettePage } from '@/components/squelette-page'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type ProprietesDetailUtilisateur = {
  idUtilisateur: string
}

// Affiche le libellé français d'un rôle système.
const libelleRoleSysteme = (role: Utilisateur['role_systeme']): string => {
  if (role === 'super_admin') return 'Super administrateur'
  return 'Organisateur'
}

// Page de détail en lecture seule : activer / désactiver uniquement.
export function DetailUtilisateur({
  idUtilisateur,
}: ProprietesDetailUtilisateur) {
  const navigate = useNavigate()
  const clientRequetes = useQueryClient()

  const requete = useQuery({
    queryKey: ['utilisateurs', idUtilisateur],
    queryFn: () => obtenirUtilisateur(idUtilisateur),
  })

  const mutationStatut = useMutation({
    mutationFn: basculerStatutUtilisateur,
    onSuccess: async (utilisateurMisAJour) => {
      void clientRequetes.invalidateQueries({ queryKey: ['utilisateurs'] })
      void clientRequetes.invalidateQueries({
        queryKey: ['utilisateurs', idUtilisateur],
      })
      await afficherSucces(
        utilisateurMisAJour.actif ? 'Compte activé' : 'Compte désactivé',
        utilisateurMisAJour.actif
          ? 'L’utilisateur peut à nouveau se connecter.'
          : 'L’utilisateur ne peut plus se connecter.'
      )
    },
    onError: async (erreur: Error) => {
      await afficherErreur(
        'Changement de statut impossible',
        erreur.message || 'Impossible de changer le statut.'
      )
    },
  })

  const utilisateur = requete.data

  // Demande confirmation avant activation / désactivation depuis la fiche.
  const confirmerBasculerStatut = async () => {
    if (!utilisateur) return
    if (utilisateur.role_systeme === 'super_admin') {
      await afficherErreur(
        'Action impossible',
        'Le compte super administrateur ne peut pas être désactivé ici.'
      )
      return
    }
    const ok = await demanderConfirmation({
      titre: utilisateur.actif ? 'Désactiver le compte ?' : 'Activer le compte ?',
      texte: utilisateur.actif
        ? `Le compte de ${utilisateur.prenom} ${utilisateur.nom} ne pourra plus se connecter.`
        : `Réactiver le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`,
      boutonConfirmer: 'Oui',
      boutonAnnuler: 'Non',
      destructif: utilisateur.actif,
      icone: 'question',
    })
    if (ok) mutationStatut.mutate(idUtilisateur)
  }

  const introuvable = !requete.isLoading && !requete.isError && !utilisateur
  const titrePage = utilisateur
    ? `${utilisateur.prenom} ${utilisateur.nom}`
    : 'Utilisateur'
  const peutBasculerStatut =
    Boolean(utilisateur) && utilisateur?.role_systeme !== 'super_admin'

  return (
    <>
      <Header
        titre={titrePage}
        actions={
          <Button variant='outline' className='min-h-11' asChild>
            <Link to='/utilisateurs'>
              <ArrowLeft className='size-4' />
              <span className='hidden sm:inline'>Retour</span>
            </Link>
          </Button>
        }
      >
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        {requete.isLoading ? <SquelettePage /> : null}
        {requete.isError ? (
          <EtatErreur
            message='Impossible de charger cet utilisateur.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {introuvable ? (
          <EtatErreur
            message='Utilisateur introuvable.'
            onReessayer={() => void navigate({ to: '/utilisateurs' })}
          />
        ) : null}

        {utilisateur ? (
          <div className='space-y-6'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <p className='text-sm text-muted-foreground'>
                Fiche en lecture seule — identifiant {utilisateur.id_utilisateur}
              </p>
              {peutBasculerStatut ? (
                <Button
                  variant='outline'
                  className='min-h-11'
                  onClick={() => void confirmerBasculerStatut()}
                >
                  <Power className='size-4' />
                  {utilisateur.actif ? 'Désactiver' : 'Activer'}
                </Button>
              ) : null}
            </div>

            <Card className='border-border/80 shadow-none'>
              <CardHeader>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <div>
                    <CardTitle>Informations du compte</CardTitle>
                    <CardDescription>
                      Consultation uniquement — pas de modification ni de
                      suppression.
                    </CardDescription>
                  </div>
                  <BadgeStatut
                    variante={utilisateur.actif ? 'actif' : 'inactif'}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <dl className='grid gap-4 sm:grid-cols-2'>
                  <div>
                    <dt className='text-sm text-muted-foreground'>Prénom</dt>
                    <dd className='font-medium'>{utilisateur.prenom}</dd>
                  </div>
                  <div>
                    <dt className='text-sm text-muted-foreground'>Nom</dt>
                    <dd className='font-medium'>{utilisateur.nom}</dd>
                  </div>
                  <div>
                    <dt className='text-sm text-muted-foreground'>E-mail</dt>
                    <dd className='font-medium'>{utilisateur.email}</dd>
                  </div>
                  <div>
                    <dt className='text-sm text-muted-foreground'>Téléphone</dt>
                    <dd className='font-medium'>{utilisateur.telephone}</dd>
                  </div>
                  <div>
                    <dt className='text-sm text-muted-foreground'>Rôle système</dt>
                    <dd className='font-medium'>
                      {libelleRoleSysteme(utilisateur.role_systeme)}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-sm text-muted-foreground'>
                      Date de création
                    </dt>
                    <dd className='font-medium'>
                      {formaterDate(utilisateur.date_creation)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </Main>
    </>
  )
}
