import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Eye,
  Plus,
  Power,
  Search,
} from 'lucide-react'
import type { Utilisateur } from '@/types'
import {
  basculerStatutUtilisateur,
  listerUtilisateurs,
} from '@/services/utilisateurs'
import { formaterDate } from '@/lib/formatage'
import {
  afficherErreur,
  afficherSucces,
  demanderConfirmation,
} from '@/lib/alertes'
import { cn, getPageNumbers } from '@/lib/utils'
import { BadgeStatut } from '@/components/badge-statut'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FormulaireUtilisateur } from './formulaire-utilisateur'

const TAILLE_PAGE = 10

type ColonneTri =
  | 'nom'
  | 'email'
  | 'role_systeme'
  | 'actif'
  | 'date_creation'

type DirectionTri = 'asc' | 'desc'

// Affiche le libellé français d'un rôle système.
const libelleRoleSysteme = (role: Utilisateur['role_systeme']): string => {
  if (role === 'super_admin') return 'Super administrateur'
  return 'Organisateur'
}

// Filtre les utilisateurs selon une recherche textuelle.
const filtrerUtilisateurs = (
  liste: Utilisateur[],
  recherche: string
): Utilisateur[] => {
  const terme = recherche.trim().toLowerCase()
  if (!terme) return liste
  return liste.filter((item) => {
    const bloc = [
      item.nom,
      item.prenom,
      item.email,
      item.telephone,
      libelleRoleSysteme(item.role_systeme),
    ]
      .join(' ')
      .toLowerCase()
    return bloc.includes(terme)
  })
}

// Trie une copie de la liste selon la colonne et la direction choisies.
const trierUtilisateurs = (
  liste: Utilisateur[],
  colonne: ColonneTri,
  direction: DirectionTri
): Utilisateur[] => {
  const copie = [...liste]
  copie.sort((a, b) => {
    let compare: number
    switch (colonne) {
      case 'nom':
        compare = `${a.nom} ${a.prenom}`.localeCompare(
          `${b.nom} ${b.prenom}`,
          'fr'
        )
        break
      case 'email':
        compare = a.email.localeCompare(b.email, 'fr')
        break
      case 'role_systeme':
        compare = a.role_systeme.localeCompare(b.role_systeme, 'fr')
        break
      case 'actif':
        compare = Number(b.actif) - Number(a.actif)
        break
      case 'date_creation':
        compare =
          new Date(a.date_creation).getTime() -
          new Date(b.date_creation).getTime()
        break
      default:
        compare = 0
    }
    return direction === 'asc' ? compare : -compare
  })
  return copie
}

// Page liste des utilisateurs avec recherche, tri et pagination.
export function PageUtilisateurs() {
  const clientRequetes = useQueryClient()
  const [recherche, definirRecherche] = useState('')
  const [pageActuelle, definirPageActuelle] = useState(1)
  const [colonneTri, definirColonneTri] = useState<ColonneTri>('date_creation')
  const [directionTri, definirDirectionTri] = useState<DirectionTri>('desc')
  const [formulaireOuvert, definirFormulaireOuvert] = useState(false)

  const requete = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: listerUtilisateurs,
  })

  const mutationStatut = useMutation({
    mutationFn: basculerStatutUtilisateur,
    onSuccess: async (utilisateur) => {
      void clientRequetes.invalidateQueries({ queryKey: ['utilisateurs'] })
      await afficherSucces(
        utilisateur.actif ? 'Compte activé' : 'Compte désactivé',
        utilisateur.actif
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

  // Demande confirmation avant activation / désactivation.
  const confirmerBasculerStatut = async (utilisateur: Utilisateur) => {
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
    if (ok) mutationStatut.mutate(utilisateur.id_utilisateur)
  }

  const listeFiltree = useMemo(
    () => trierUtilisateurs(
      filtrerUtilisateurs(requete.data ?? [], recherche),
      colonneTri,
      directionTri
    ),
    [requete.data, recherche, colonneTri, directionTri]
  )

  const nombrePages = Math.max(1, Math.ceil(listeFiltree.length / TAILLE_PAGE))
  const pageCourante = Math.min(pageActuelle, nombrePages)
  const debut = (pageCourante - 1) * TAILLE_PAGE
  const pageItems = listeFiltree.slice(debut, debut + TAILLE_PAGE)
  const numerosPages = getPageNumbers(pageCourante, nombrePages)

  // Bascule ou fixe l’ordre de tri pour une colonne du tableau.
  const basculerTri = (colonne: ColonneTri) => {
    definirPageActuelle(1)
    if (colonneTri === colonne) {
      definirDirectionTri((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      definirColonneTri(colonne)
      definirDirectionTri('asc')
    }
  }

  // Ouvre le formulaire de création d'organisateur.
  const ouvrirCreation = () => {
    definirFormulaireOuvert(true)
  }

  // Icône de tri affichée dans l’en-tête de colonne.
  const iconeTri = (colonne: ColonneTri) => {
    if (colonneTri !== colonne) {
      return <ArrowUpDown className='size-3.5 opacity-50' aria-hidden />
    }
    return directionTri === 'asc' ? (
      <ArrowUp className='size-3.5' aria-hidden />
    ) : (
      <ArrowDown className='size-3.5' aria-hidden />
    )
  }

  // Boutons d’actions : détail + activer/désactiver uniquement.
  const actionsLigne = (utilisateur: Utilisateur) => (
    <div className='flex flex-wrap items-center gap-1'>
      <Button variant='ghost' size='icon' className='size-9' asChild>
        <Link
          to='/utilisateurs/$idUtilisateur'
          params={{ idUtilisateur: utilisateur.id_utilisateur }}
          title='Voir le détail'
        >
          <Eye className='size-4' />
          <span className='sr-only'>Voir</span>
        </Link>
      </Button>
      {utilisateur.role_systeme !== 'super_admin' ? (
        <Button
          variant='ghost'
          size='icon'
          className='size-9'
          title={utilisateur.actif ? 'Désactiver' : 'Activer'}
          onClick={() => void confirmerBasculerStatut(utilisateur)}
        >
          <Power className='size-4' />
          <span className='sr-only'>
            {utilisateur.actif ? 'Désactiver' : 'Activer'}
          </span>
        </Button>
      ) : null}
    </div>
  )

  return (
    <>
      <Header
        titre='Utilisateurs'
        actions={
          <Button
            className='min-h-11 hover:bg-principal-hover'
            onClick={ouvrirCreation}
          >
            <Plus className='size-4' />
            <span className='hidden sm:inline'>Nouvel organisateur</span>
          </Button>
        }
      >
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        <div className='relative mb-4 max-w-md'>
          <Search className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={recherche}
            onChange={(event) => {
              definirRecherche(event.target.value)
              definirPageActuelle(1)
            }}
            placeholder='Rechercher par nom, e-mail, téléphone…'
            className='min-h-11 ps-9'
            aria-label='Rechercher des utilisateurs'
          />
        </div>

        {requete.isLoading ? <SquelettePage /> : null}
        {requete.isError ? (
          <EtatErreur
            message='Impossible de charger la liste des utilisateurs.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {!requete.isLoading && !requete.isError ? (
          <>
            {listeFiltree.length === 0 ? (
              <EtatVide
                titre={
                  recherche.trim()
                    ? 'Aucun résultat pour cette recherche'
                    : 'Aucun utilisateur'
                }
                description={
                  recherche.trim()
                    ? 'Modifiez les termes de recherche ou créez un compte.'
                    : 'Commencez par ajouter un organisateur à la plateforme.'
                }
                action={
                  !recherche.trim() ? (
                    <Button
                      className='min-h-11'
                      onClick={ouvrirCreation}
                    >
                      <Plus className='size-4' />
                      Créer un organisateur
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className='space-y-3 md:hidden'>
                  {pageItems.map((utilisateur) => (
                    <article
                      key={utilisateur.id_utilisateur}
                      className='rounded-xl border border-border bg-card p-4 shadow-xs'
                    >
                      <div className='mb-3 flex items-start justify-between gap-2'>
                        <div>
                          <p className='font-medium'>
                            {utilisateur.prenom} {utilisateur.nom}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {utilisateur.email}
                          </p>
                        </div>
                        <BadgeStatut
                          variante={utilisateur.actif ? 'actif' : 'inactif'}
                        />
                      </div>
                      <dl className='mb-3 grid grid-cols-2 gap-2 text-sm'>
                        <div>
                          <dt className='text-muted-foreground'>Téléphone</dt>
                          <dd>{utilisateur.telephone}</dd>
                        </div>
                        <div>
                          <dt className='text-muted-foreground'>Rôle</dt>
                          <dd>{libelleRoleSysteme(utilisateur.role_systeme)}</dd>
                        </div>
                        <div className='col-span-2'>
                          <dt className='text-muted-foreground'>Créé le</dt>
                          <dd>{formaterDate(utilisateur.date_creation)}</dd>
                        </div>
                      </dl>
                      {actionsLigne(utilisateur)}
                    </article>
                  ))}
                </div>

                <div className='hidden overflow-x-auto rounded-xl border border-border md:block'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <button
                            type='button'
                            className='inline-flex items-center gap-1 font-medium hover:text-primary'
                            onClick={() => basculerTri('nom')}
                          >
                            Nom {iconeTri('nom')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type='button'
                            className='inline-flex items-center gap-1 font-medium hover:text-primary'
                            onClick={() => basculerTri('email')}
                          >
                            E-mail {iconeTri('email')}
                          </button>
                        </TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>
                          <button
                            type='button'
                            className='inline-flex items-center gap-1 font-medium hover:text-primary'
                            onClick={() => basculerTri('role_systeme')}
                          >
                            Rôle {iconeTri('role_systeme')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type='button'
                            className='inline-flex items-center gap-1 font-medium hover:text-primary'
                            onClick={() => basculerTri('actif')}
                          >
                            Statut {iconeTri('actif')}
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type='button'
                            className='inline-flex items-center gap-1 font-medium hover:text-primary'
                            onClick={() => basculerTri('date_creation')}
                          >
                            Créé le {iconeTri('date_creation')}
                          </button>
                        </TableHead>
                        <TableHead className='text-end'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageItems.map((utilisateur) => (
                        <TableRow key={utilisateur.id_utilisateur}>
                          <TableCell className='font-medium'>
                            {utilisateur.prenom} {utilisateur.nom}
                          </TableCell>
                          <TableCell>{utilisateur.email}</TableCell>
                          <TableCell>{utilisateur.telephone}</TableCell>
                          <TableCell>
                            {libelleRoleSysteme(utilisateur.role_systeme)}
                          </TableCell>
                          <TableCell>
                            <BadgeStatut
                              variante={
                                utilisateur.actif ? 'actif' : 'inactif'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {formaterDate(utilisateur.date_creation)}
                          </TableCell>
                          <TableCell className='text-end'>
                            {actionsLigne(utilisateur)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div
                  className={cn(
                    'mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row',
                    listeFiltree.length <= TAILLE_PAGE && 'hidden'
                  )}
                >
                  <p className='text-sm text-muted-foreground'>
                    {listeFiltree.length} utilisateur
                    {listeFiltree.length > 1 ? 's' : ''} — page {pageCourante}{' '}
                    sur {nombrePages}
                  </p>
                  <div className='flex flex-wrap items-center gap-1'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='min-h-9'
                      disabled={pageCourante <= 1}
                      onClick={() =>
                        definirPageActuelle((p) => Math.max(1, p - 1))
                      }
                    >
                      Précédent
                    </Button>
                    {numerosPages.map((numero, index) =>
                      numero === '...' ? (
                        <span
                          key={`ellipsis-${index}`}
                          className='px-2 text-sm text-muted-foreground'
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={numero}
                          variant={
                            pageCourante === numero ? 'default' : 'outline'
                          }
                          size='sm'
                          className='min-h-9 min-w-9'
                          onClick={() => definirPageActuelle(numero as number)}
                        >
                          {numero}
                        </Button>
                      )
                    )}
                    <Button
                      variant='outline'
                      size='sm'
                      className='min-h-9'
                      disabled={pageCourante >= nombrePages}
                      onClick={() =>
                        definirPageActuelle((p) =>
                          Math.min(nombrePages, p + 1)
                        )
                      }
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        ) : null}
      </Main>

      <FormulaireUtilisateur
        ouvert={formulaireOuvert}
        onOuvertChange={definirFormulaireOuvert}
      />
    </>
  )
}
