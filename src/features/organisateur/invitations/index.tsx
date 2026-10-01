import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Loader2, ScanLine, Trash2 } from 'lucide-react'
import {
  creerInvitation,
  listerInvitations,
  simulerScanInvitation,
  supprimerInvitation,
  type InvitationEnrichie,
} from '@/services/invitations'
import { listerTables, type TableEnrichie } from '@/services/tables'
import { obtenirModeleInvitation } from '@/services/modeles-invitation'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useEcran } from '@/hooks/use-ecran'
import {
  afficherErreur,
  afficherSucces,
  apresFermetureOverlay,
  demanderConfirmation,
} from '@/lib/alertes'
import { formaterDate, libelleTable } from '@/lib/formatage'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { GardeEvenementActif } from '@/features/organisateur/composants/bandeau-evenement-actif'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { FeuilleModale } from '@/components/feuille-modale'
import { ListeAdaptative } from '@/components/liste-adaptative'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { BadgeStatut } from '@/components/badge-statut'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Invite } from '@/types'

/** Associe chaque invité à son invitation (s’il en a une). */
function cartographierInvitationsParInvite(
  invitations: InvitationEnrichie[]
): Map<string, InvitationEnrichie> {
  const carte = new Map<string, InvitationEnrichie>()
  for (const invitation of invitations) {
    for (const idInvite of invitation.ids_invites) {
      carte.set(idInvite, invitation)
    }
  }
  return carte
}

/** Contenu principal : tables → invités → invitations générées. */
function ContenuInvitations() {
  const { evenementActif, aLeDroit } = useEvenementActif()
  const clientRequetes = useQueryClient()
  const idEvenement = evenementActif!.id_evenement

  const [idTableActive, definirIdTableActive] = useState<string | null>(null)
  const [selectionInvites, definirSelectionInvites] = useState<Set<string>>(
    new Set()
  )
  const [invitationApercu, definirInvitationApercu] =
    useState<InvitationEnrichie | null>(null)

  const peutGerer = aLeDroit('gerer_invites')

  const requeteTables = useQuery({
    queryKey: ['tables', idEvenement],
    queryFn: () => listerTables(idEvenement),
  })

  const requeteInvitations = useQuery({
    queryKey: ['invitations', idEvenement],
    queryFn: () => listerInvitations(idEvenement),
  })

  const requeteModele = useQuery({
    queryKey: ['modele-invitation', idEvenement],
    queryFn: () => obtenirModeleInvitation(idEvenement),
    enabled: invitationApercu !== null,
  })

  const invitations = requeteInvitations.data ?? []
  const invitationParInvite = useMemo(
    () => cartographierInvitationsParInvite(invitations),
    [invitations]
  )

  const tableActive = useMemo(() => {
    if (!idTableActive || !requeteTables.data) return null
    return (
      requeteTables.data.find((t) => t.id_table === idTableActive) ?? null
    )
  }, [idTableActive, requeteTables.data])

  const idsSelectionnes = useMemo(
    () => [...selectionInvites],
    [selectionInvites]
  )

  /** Invalide les requêtes liées aux invitations et tables. */
  const invalider = async () => {
    await clientRequetes.invalidateQueries({
      queryKey: ['invitations', idEvenement],
    })
    await clientRequetes.invalidateQueries({
      queryKey: ['tables', idEvenement],
    })
    await clientRequetes.invalidateQueries({ queryKey: ['invites', idEvenement] })
    await clientRequetes.invalidateQueries({
      queryKey: ['stats-evenement', idEvenement],
    })
  }

  const mutationCreer = useMutation({
    mutationFn: (ids: string[]) => creerInvitation(idEvenement, ids),
    onSuccess: async () => {
      await invalider()
      definirSelectionInvites(new Set())
      await apresFermetureOverlay(() => {
        definirInvitationApercu(null)
      }, async () => {
        await afficherSucces('Invitation créée')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirInvitationApercu(null)
      }, async () => {
        await afficherErreur('Création impossible', erreur.message)
      })
    },
  })

  const mutationSupprimer = useMutation({
    mutationFn: supprimerInvitation,
    onSuccess: async () => {
      await invalider()
      await apresFermetureOverlay(() => {
        definirInvitationApercu(null)
      }, async () => {
        await afficherSucces('Invitation supprimée')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirInvitationApercu(null)
      }, async () => {
        await afficherErreur('Suppression impossible', erreur.message)
      })
    },
  })

  const mutationScan = useMutation({
    mutationFn: simulerScanInvitation,
    onSuccess: async () => {
      await invalider()
      await apresFermetureOverlay(() => {
        definirInvitationApercu(null)
      }, async () => {
        await afficherSucces('Scan enregistré')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirInvitationApercu(null)
      }, async () => {
        await afficherErreur('Simulation impossible', erreur.message)
      })
    },
  })

  /** Sélectionne une table et réinitialise la sélection d’invités. */
  const selectionnerTable = (table: TableEnrichie) => {
    definirIdTableActive(table.id_table)
    definirSelectionInvites(new Set())
  }

  /** Bascule la sélection d’un invité éligible (sans invitation). */
  const basculerInvite = (invite: Invite, coche: boolean) => {
    if (invitationParInvite.has(invite.id_invite)) return
    definirSelectionInvites((prev) => {
      const suivant = new Set(prev)
      if (coche) suivant.add(invite.id_invite)
      else suivant.delete(invite.id_invite)
      return suivant
    })
  }

  /** Crée une invitation pour les invités sélectionnés à la table active. */
  const creerDepuisSelection = () => {
    if (idsSelectionnes.length === 0) {
      void afficherErreur(
        'Sélection vide',
        'Choisissez au moins une personne sans invitation.'
      )
      return
    }
    mutationCreer.mutate(idsSelectionnes)
  }

  /** Ouvre l’aperçu d’une invitation. */
  const ouvrirApercu = (invitation: InvitationEnrichie) => {
    definirInvitationApercu(invitation)
  }

  /** Ferme l’aperçu modal. */
  const fermerApercu = () => {
    definirInvitationApercu(null)
  }

  /** Confirme la suppression d’une invitation. */
  const confirmerSuppression = async (invitation: InvitationEnrichie) => {
    const multi = invitation.ids_invites.length > 1
    const ok = await demanderConfirmation({
      titre: 'Supprimer cette invitation ?',
      texte: multi
        ? `Unité indivisible : les ${invitation.ids_invites.length} personnes du ${invitation.type_invitation} « ${invitation.libelle_noms} » seront aussi retirées.`
        : 'Le code QR ne sera plus valide. L’invité reste dans la liste.',
      destructif: true,
    })
    if (ok) mutationSupprimer.mutate(invitation.id_invitation)
  }

  /** Simule un scan QR (développement). */
  const simulerScan = (invitation: InvitationEnrichie) => {
    if (!import.meta.env.DEV) return
    mutationScan.mutate(invitation.id_invitation)
  }

  const enCours =
    mutationCreer.isPending ||
    mutationSupprimer.isPending ||
    mutationScan.isPending

  const chargementInitial =
    requeteTables.isLoading || requeteInvitations.isLoading
  const erreurChargement =
    requeteTables.isError || requeteInvitations.isError

  return (
    <div className='flex flex-col gap-8 px-4 py-4 sm:px-6'>
      <section className='flex flex-col gap-3' aria-labelledby='titre-tables'>
        <div className='flex flex-col gap-1'>
          <h2
            id='titre-tables'
            className='text-lg font-semibold text-foreground'
          >
            Tables
          </h2>
          <p className='text-sm text-muted-foreground'>
            Choisissez une table pour voir ses invités et créer des invitations.
          </p>
        </div>

        {chargementInitial ? <SquelettePage /> : null}
        {erreurChargement ? (
          <EtatErreur
            message='Impossible de charger les tables ou les invitations.'
            onReessayer={() => {
              void requeteTables.refetch()
              void requeteInvitations.refetch()
            }}
          />
        ) : null}

        {!chargementInitial && !erreurChargement && requeteTables.data ? (
          requeteTables.data.length === 0 ? (
            <EtatVide
              titre='Aucune table'
              description='Créez des tables et affectez des invités avant de générer des QR.'
              action={
                <Button asChild variant='secondary' className='min-h-11'>
                  <Link to='/organisateur/tables'>Gérer les tables</Link>
                </Button>
              }
            />
          ) : (
            <ul className='flex flex-col gap-2'>
              {requeteTables.data.map((table) => {
                const active = idTableActive === table.id_table
                return (
                  <li key={table.id_table}>
                    <button
                      type='button'
                      onClick={() => selectionnerTable(table)}
                      className={cn(
                        'flex w-full min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors duration-150',
                        'hover:border-primary/40 hover:bg-accent/30',
                        active && 'border-primary bg-accent/40'
                      )}
                    >
                      <span className='font-medium text-foreground'>
                        {libelleTable(table.numero_table, table.nom_table)}
                      </span>
                      <span className='shrink-0 text-sm text-muted-foreground'>
                        {table.invites.length} invité
                        {table.invites.length !== 1 ? 's' : ''} · cap.{' '}
                        {table.capacite}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )
        ) : null}

        {tableActive ? (
          <div className='rounded-xl border border-border bg-muted/30 p-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <h3 className='font-semibold text-foreground'>
                Invités —{' '}
                {libelleTable(
                  tableActive.numero_table,
                  tableActive.nom_table
                )}
              </h3>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='min-h-9'
                onClick={() => {
                  definirIdTableActive(null)
                  definirSelectionInvites(new Set())
                }}
              >
                Fermer
              </Button>
            </div>

            {tableActive.invites.length === 0 ? (
              <p className='mt-3 text-sm text-muted-foreground'>
                Aucun invité affecté à cette table.
              </p>
            ) : (
              <ul className='mt-3 flex flex-col gap-2'>
                {tableActive.invites.map((invite) => {
                  const invitationLiee = invitationParInvite.get(
                    invite.id_invite
                  )
                  const peutSelectionner =
                    peutGerer && !invitationLiee && !mutationCreer.isPending

                  return (
                    <li
                      key={invite.id_invite}
                      className='flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2'
                    >
                      {peutGerer ? (
                        <Checkbox
                          id={`tbl-inv-${invite.id_invite}`}
                          checked={selectionInvites.has(invite.id_invite)}
                          disabled={Boolean(invitationLiee) || enCours}
                          onCheckedChange={(val) =>
                            basculerInvite(invite, val === true)
                          }
                        />
                      ) : null}
                      <Label
                        htmlFor={
                          peutGerer
                            ? `tbl-inv-${invite.id_invite}`
                            : undefined
                        }
                        className={cn(
                          'flex flex-1 flex-wrap items-center gap-2 font-medium',
                          peutSelectionner && 'cursor-pointer'
                        )}
                      >
                        <span>{invite.nom_complet}</span>
                        {invitationLiee ? (
                          <span className='inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground'>
                            QR {invitationLiee.code_qr}
                          </span>
                        ) : (
                          <span className='text-xs font-normal text-muted-foreground'>
                            Sans invitation
                          </span>
                        )}
                      </Label>
                    </li>
                  )
                })}
              </ul>
            )}

            {peutGerer && tableActive.invites.length > 0 ? (
              <Button
                type='button'
                className='mt-4 min-h-11 w-full sm:w-auto'
                disabled={
                  mutationCreer.isPending || idsSelectionnes.length === 0
                }
                onClick={creerDepuisSelection}
              >
                {mutationCreer.isPending ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  `Créer une invitation (${idsSelectionnes.length})`
                )}
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section
        className='flex flex-col gap-3'
        aria-labelledby='titre-invitations'
      >
        <div className='flex flex-col gap-1'>
          <h2
            id='titre-invitations'
            className='text-lg font-semibold text-foreground'
          >
            Invitations générées
          </h2>
          <p className='text-sm text-muted-foreground'>
            Tous les codes QR créés pour cet événement.
          </p>
        </div>

        {!chargementInitial &&
        !erreurChargement &&
        requeteInvitations.data ? (
          requeteInvitations.data.length === 0 ? (
            <EtatVide
              titre='Aucune invitation'
              description='Les invitations (QR) sont créées automatiquement à l’ajout d’un invité, couple ou famille. Vous pouvez aussi en créer ici pour des personnes encore sans QR.'
            />
          ) : (
            <ListeAdaptative
              donnees={requeteInvitations.data}
              cleLigne={(inv) => inv.id_invitation}
              colonnes={[
                {
                  cle: 'noms',
                  libelle: 'Personnes',
                  cellule: (inv) => (
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span className='font-medium'>{inv.libelle_noms}</span>
                        <BadgeStatut
                          variante='info'
                          libelle={
                            inv.type_invitation === 'seul'
                              ? 'Seul'
                              : inv.type_invitation === 'couple'
                                ? 'Couple'
                                : inv.type_invitation === 'famille'
                                  ? 'Famille'
                                  : 'Groupe'
                          }
                        />
                      </div>
                      {inv.type_invitation !== 'seul' &&
                      inv.type_invitation !== 'couple' ? (
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {inv.invites.map((i) => i.nom_complet).join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  cle: 'qr',
                  libelle: 'Code QR',
                  cellule: (inv) => (
                    <code className='text-xs text-foreground'>{inv.code_qr}</code>
                  ),
                },
                {
                  cle: 'date',
                  libelle: 'Date',
                  cellule: (inv) => (
                    <span className='text-sm text-muted-foreground'>
                      {formaterDate(inv.date_creation)}
                    </span>
                  ),
                },
                {
                  cle: 'presence',
                  libelle: 'Présence',
                  cellule: (inv) => (
                    <BadgeStatut
                      variante={
                        inv.statut_presence === 'present' ? 'present' : 'absent'
                      }
                    />
                  ),
                },
                {
                  cle: 'actions',
                  libelle: '',
                  cellule: (inv) => (
                    <div className='flex items-center gap-1'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='min-h-9 gap-1'
                        onClick={() => ouvrirApercu(inv)}
                      >
                        <Eye className='size-3.5' />
                        Aperçu
                      </Button>
                      {import.meta.env.DEV &&
                      inv.statut_presence !== 'present' ? (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          className='min-h-9'
                          disabled={enCours}
                          onClick={() => simulerScan(inv)}
                        >
                          <ScanLine className='size-3' />
                          Scan
                        </Button>
                      ) : null}
                      {peutGerer ? (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-9 text-destructive'
                          aria-label='Supprimer'
                          disabled={enCours}
                          onClick={() => void confirmerSuppression(inv)}
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      ) : null}
                    </div>
                  ),
                },
              ]}
              renduCarte={(inv) => (
                <article className='rounded-xl border border-border bg-card p-4'>
                  <p className='font-semibold'>{inv.libelle_noms}</p>
                  <p className='mt-1 font-mono text-sm text-muted-foreground'>
                    {inv.code_qr}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Créée le {formaterDate(inv.date_creation)}
                  </p>
                  <div className='mt-2 flex flex-wrap items-center gap-2'>
                    <BadgeStatut
                      variante={
                        inv.statut_presence === 'present' ? 'present' : 'absent'
                      }
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='min-h-9'
                      onClick={() => ouvrirApercu(inv)}
                    >
                      Aperçu
                    </Button>
                    {import.meta.env.DEV && inv.statut_presence !== 'present' ? (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        className='min-h-9'
                        disabled={enCours}
                        onClick={() => simulerScan(inv)}
                      >
                        Simuler scan
                      </Button>
                    ) : null}
                    {peutGerer ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        className='text-destructive'
                        disabled={enCours}
                        onClick={() => void confirmerSuppression(inv)}
                      >
                        Supprimer
                      </Button>
                    ) : null}
                  </div>
                </article>
              )}
            />
          )
        ) : null}
      </section>

      <FeuilleModale
        ouvert={invitationApercu !== null}
        onFermer={fermerApercu}
        titre='Aperçu invitation'
        description={invitationApercu?.libelle_noms}
        pleinEcranMobile
      >
        {invitationApercu ? (
          <div className='flex flex-col gap-4'>
            <div className='rounded-xl border border-border bg-card p-4 text-center'>
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Invité(s)
              </p>
              <p className='mt-2 text-lg font-semibold text-foreground'>
                {invitationApercu.libelle_noms}
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl border border-primary/30 bg-accent/30 p-6 text-center'
              )}
            >
              <p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Code QR
              </p>
              <p className='mt-3 break-all font-mono text-2xl font-semibold text-foreground sm:text-3xl'>
                {invitationApercu.code_qr}
              </p>
            </div>
            {requeteModele.isLoading ? (
              <p className='text-sm text-muted-foreground'>
                Vérification du modèle PDF…
              </p>
            ) : requeteModele.data ? (
              <p className='text-sm text-muted-foreground'>
                Un modèle PDF est configuré pour cet événement.{' '}
                <Link
                  to='/organisateur/generation'
                  className='font-medium text-primary underline-offset-4 hover:underline'
                  onClick={fermerApercu}
                >
                  Générer les PDF personnalisés
                </Link>
              </p>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Aucun modèle PDF pour l’instant.{' '}
                <Link
                  to='/organisateur/invitation'
                  className='font-medium text-primary underline-offset-4 hover:underline'
                  onClick={fermerApercu}
                >
                  Configurer le modèle
                </Link>
              </p>
            )}
            <Button type='button' className='min-h-11' onClick={fermerApercu}>
              Fermer
            </Button>
          </div>
        ) : null}
      </FeuilleModale>
    </div>
  )
}

/** Page invitations QR de l’événement actif. */
export function PageInvitations() {
  const { estMobile } = useEcran()

  return (
    <>
      <EnTeteOrganisateur
        titre='Invitations'
        actions={
          !estMobile ? (
            <>
              <ThemeSwitch />
              <ProfileDropdown />
            </>
          ) : null
        }
      />
      <GardeEvenementActif>
        <ContenuInvitations />
      </GardeEvenementActif>
    </>
  )
}
