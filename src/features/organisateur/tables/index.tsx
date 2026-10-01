import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react'
import {
  creerTable,
  listerTables,
  modifierTable,
  supprimerTable,
  type TableEnrichie,
} from '@/services/tables'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useEcran } from '@/hooks/use-ecran'
import {
  afficherErreur,
  afficherSucces,
  apresFermetureOverlay,
  demanderConfirmation,
} from '@/lib/alertes'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { GardeEvenementActif } from '@/features/organisateur/composants/bandeau-evenement-actif'
import { BoutonActionFlottant } from '@/features/organisateur/composants/bouton-action-flottant'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { FeuilleModale } from '@/components/feuille-modale'
import { ListeAdaptative } from '@/components/liste-adaptative'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { libelleTable } from '@/lib/formatage'

const schemaTable = z.object({
  numero_table: z.number().int().min(1, 'Le numéro doit être au moins 1.'),
  nom_table: z
    .string()
    .trim()
    .min(1, 'Le nom de la table est obligatoire.')
    .max(60, 'Le nom ne peut pas dépasser 60 caractères.'),
  capacite: z.number().int().min(1, 'La capacité doit être au moins 1.'),
})

type DonneesFormulaireTable = z.infer<typeof schemaTable>

/** Valeurs vides du formulaire table. */
function valeursParDefautTable(prochainNumero = 1): DonneesFormulaireTable {
  return { numero_table: prochainNumero, nom_table: '', capacite: 8 }
}

/** Convertit une table en valeurs de formulaire. */
function tableVersFormulaire(table: TableEnrichie): DonneesFormulaireTable {
  return {
    numero_table: table.numero_table,
    nom_table: table.nom_table,
    capacite: table.capacite,
  }
}

/** Calcule le pourcentage d’occupation d’une table. */
function pourcentageOccupation(table: TableEnrichie): number {
  if (table.capacite <= 0) return 0
  return Math.min(100, (table.places_occupees / table.capacite) * 100)
}

/** Barre de progression d’occupation. */
function BarreOccupation({ table }: { table: TableEnrichie }) {
  const pct = pourcentageOccupation(table)
  const pleine = table.places_disponibles <= 0
  return (
    <div className='space-y-1'>
      <div className='flex justify-between text-xs text-muted-foreground'>
        <span>
          {table.places_occupees} / {table.capacite} places
        </span>
        <span>{table.places_disponibles} libre(s)</span>
      </div>
      <div
        className='h-2 overflow-hidden rounded-full bg-muted'
        role='progressbar'
        aria-valuenow={table.places_occupees}
        aria-valuemin={0}
        aria-valuemax={table.capacite}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-200',
            pleine ? 'bg-attention' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/** Contenu principal page tables. */
function ContenuTables() {
  const { evenementActif, aLeDroit } = useEvenementActif()
  const { estMobile } = useEcran()
  const clientRequetes = useQueryClient()
  const idEvenement = evenementActif!.id_evenement

  const [modaleFormulaire, definirModaleFormulaire] = useState(false)
  const [modaleInvites, definirModaleInvites] = useState(false)
  const [tableEditee, definirTableEditee] = useState<TableEnrichie | null>(null)
  const [tableConsultee, definirTableConsultee] = useState<TableEnrichie | null>(
    null
  )

  const peutGerer = aLeDroit('gerer_tables')

  const requete = useQuery({
    queryKey: ['tables', idEvenement],
    queryFn: () => listerTables(idEvenement),
  })

  const formulaire = useForm<DonneesFormulaireTable>({
    resolver: zodResolver(schemaTable),
    defaultValues: valeursParDefautTable(),
  })

  const tablesTriees = useMemo(() => {
    if (!requete.data) return []
    return [...requete.data].sort((a, b) => a.numero_table - b.numero_table)
  }, [requete.data])

  useEffect(() => {
    if (modaleFormulaire) {
      const prochainNumero =
        tablesTriees.length > 0
          ? Math.max(...tablesTriees.map((t) => t.numero_table)) + 1
          : 1
      formulaire.reset(
        tableEditee
          ? tableVersFormulaire(tableEditee)
          : valeursParDefautTable(prochainNumero)
      )
    }
  }, [modaleFormulaire, tableEditee, formulaire, tablesTriees])

  const invalider = async () => {
    await clientRequetes.invalidateQueries({ queryKey: ['tables', idEvenement] })
    await clientRequetes.invalidateQueries({ queryKey: ['invites', idEvenement] })
  }

  /** Ferme le formulaire table puis exécute une alerte. */
  const alerteApresFormulaire = async (
    action: () => Promise<void>
  ): Promise<void> => {
    await apresFermetureOverlay(() => {
      definirModaleFormulaire(false)
      definirTableEditee(null)
    }, action)
  }

  const mutationCreer = useMutation({
    mutationFn: (donnees: DonneesFormulaireTable) =>
      creerTable(idEvenement, donnees),
    onSuccess: async () => {
      await invalider()
      await alerteApresFormulaire(async () => {
        await afficherSucces('Table créée')
      })
    },
    onError: async (erreur: Error) => {
      await alerteApresFormulaire(async () => {
        await afficherErreur('Création impossible', erreur.message)
      })
    },
  })

  const mutationModifier = useMutation({
    mutationFn: ({
      id,
      donnees,
    }: {
      id: string
      donnees: DonneesFormulaireTable
    }) => modifierTable(id, donnees),
    onSuccess: async () => {
      await invalider()
      await alerteApresFormulaire(async () => {
        await afficherSucces('Table modifiée')
      })
    },
    onError: async (erreur: Error) => {
      await alerteApresFormulaire(async () => {
        await afficherErreur('Modification impossible', erreur.message)
      })
    },
  })

  const mutationSupprimer = useMutation({
    mutationFn: supprimerTable,
    onSuccess: async () => {
      await invalider()
      await afficherSucces('Table supprimée')
    },
    onError: async (erreur: Error) => {
      await afficherErreur('Suppression impossible', erreur.message)
    },
  })

  /** Ouvre la création de table. */
  const ouvrirCreation = () => {
    definirTableEditee(null)
    definirModaleFormulaire(true)
  }

  /** Ouvre l’édition de table. */
  const ouvrirEdition = (table: TableEnrichie) => {
    definirTableEditee(table)
    definirModaleFormulaire(true)
  }

  /** Affiche les invités d’une table. */
  const voirInvites = (table: TableEnrichie) => {
    definirTableConsultee(table)
    definirModaleInvites(true)
  }

  /** Confirme la suppression d’une table. */
  const confirmerSuppression = async (table: TableEnrichie) => {
    const ok = await demanderConfirmation({
      titre: `Supprimer ${libelleTable(table.numero_table, table.nom_table)} ?`,
      texte: 'Les affectations à cette table seront retirées.',
      destructif: true,
    })
    if (ok) mutationSupprimer.mutate(table.id_table)
  }

  /** Soumet le formulaire table. */
  const soumettreFormulaire = (donnees: DonneesFormulaireTable) => {
    if (tableEditee) {
      mutationModifier.mutate({ id: tableEditee.id_table, donnees })
    } else {
      mutationCreer.mutate(donnees)
    }
  }

  const enCours =
    mutationCreer.isPending ||
    mutationModifier.isPending ||
    mutationSupprimer.isPending

  const capaciteMin =
    tableEditee?.places_occupees && tableEditee.places_occupees > 0
      ? tableEditee.places_occupees
      : 1

  /** Menu actions par table. */
  const menuActions = (table: TableEnrichie) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='size-11 sm:size-9'
          aria-label='Actions'
        >
          <MoreHorizontal className='size-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuItem onClick={() => voirInvites(table)}>
          <Users className='me-2 size-4' />
          Voir les invités
        </DropdownMenuItem>
        {peutGerer ? (
          <>
            <DropdownMenuItem onClick={() => ouvrirEdition(table)}>
              <Pencil className='me-2 size-4' />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={() => void confirmerSuppression(table)}
            >
              <Trash2 className='me-2 size-4' />
              Supprimer
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      {peutGerer && !estMobile ? (
        <div className='flex justify-end'>
          <Button type='button' onClick={ouvrirCreation} className='gap-2'>
            <Plus className='size-4' />
            Nouvelle table
          </Button>
        </div>
      ) : null}

      {requete.isLoading ? <SquelettePage /> : null}
      {requete.isError ? (
        <EtatErreur
          message='Impossible de charger les tables.'
          onReessayer={() => void requete.refetch()}
        />
      ) : null}

      {!requete.isLoading && !requete.isError && requete.data ? (
        tablesTriees.length === 0 ? (
          <EtatVide
            titre='Aucune table'
            description='Créez des tables pour organiser le placement.'
            action={
              peutGerer ? (
                <Button type='button' onClick={ouvrirCreation}>
                  Créer une table
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ListeAdaptative
            donnees={tablesTriees}
            cleLigne={(t) => t.id_table}
            colonnes={[
              {
                cle: 'numero',
                libelle: 'N°',
                cellule: (t) => (
                  <span className='font-semibold'>{t.numero_table}</span>
                ),
              },
              {
                cle: 'nom',
                libelle: 'Nom',
                cellule: (t) => (
                  <span className='font-medium'>{t.nom_table}</span>
                ),
              },
              {
                cle: 'capacite',
                libelle: 'Capacité',
                cellule: (t) => t.capacite,
              },
              {
                cle: 'occupation',
                libelle: 'Occupation',
                cellule: (t) => <BarreOccupation table={t} />,
              },
              {
                cle: 'actions',
                libelle: '',
                cellule: (t) => menuActions(t),
              },
            ]}
            renduCarte={(t) => (
              <article className='rounded-xl border border-border bg-card p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1'>
                    <h2 className='font-semibold'>
                      {libelleTable(t.numero_table, t.nom_table)}
                    </h2>
                    <p className='text-sm text-muted-foreground'>
                      Capacité : {t.capacite}
                    </p>
                    <div className='mt-3'>
                      <BarreOccupation table={t} />
                    </div>
                    <Button
                      type='button'
                      variant='link'
                      className='mt-2 h-auto p-0'
                      onClick={() => voirInvites(t)}
                    >
                      Voir les invités ({t.invites.length})
                    </Button>
                  </div>
                  {menuActions(t)}
                </div>
              </article>
            )}
          />
        )
      ) : null}

      {peutGerer ? (
        <BoutonActionFlottant libelle='Créer une table' onClick={ouvrirCreation} />
      ) : null}

      <FeuilleModale
        ouvert={modaleFormulaire}
        onFermer={() => {
          if (!enCours) {
            definirModaleFormulaire(false)
            definirTableEditee(null)
          }
        }}
        titre={tableEditee ? 'Modifier la table' : 'Nouvelle table'}
        pleinEcranMobile
      >
        <Form {...formulaire}>
          <form
            onSubmit={formulaire.handleSubmit(soumettreFormulaire)}
            className='flex flex-col gap-4'
          >
            <FormField
              control={formulaire.control}
              name='numero_table'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numéro de table</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={1}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          Number.isNaN(e.target.valueAsNumber)
                            ? 1
                            : e.target.valueAsNumber
                        )
                      }
                      className='min-h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulaire.control}
              name='nom_table'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la table</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Ex. VIP, Famille, Honneur…'
                      className='min-h-11'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulaire.control}
              name='capacite'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacité (places)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={capaciteMin}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(
                          Number.isNaN(e.target.valueAsNumber)
                            ? capaciteMin
                            : e.target.valueAsNumber
                        )
                      }
                      className='min-h-11'
                    />
                  </FormControl>
                  {tableEditee && tableEditee.places_occupees > 0 ? (
                    <p className='text-xs text-muted-foreground'>
                      Minimum {tableEditee.places_occupees} (places déjà
                      occupées).
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' className='min-h-11' disabled={enCours}>
              {enCours ? (
                <Loader2 className='size-4 animate-spin' />
              ) : tableEditee ? (
                'Enregistrer'
              ) : (
                'Créer'
              )}
            </Button>
          </form>
        </Form>
      </FeuilleModale>

      <FeuilleModale
        ouvert={modaleInvites}
        onFermer={() => {
          definirModaleInvites(false)
          definirTableConsultee(null)
        }}
        titre={
          tableConsultee
            ? `Invités — ${libelleTable(tableConsultee.numero_table, tableConsultee.nom_table)}`
            : 'Invités'
        }
      >
        {tableConsultee ? (
          tableConsultee.invites.length === 0 ? (
            <EtatVide titre='Aucun invité' description='Table vide pour l’instant.' />
          ) : (
            <ul className='flex flex-col gap-2'>
              {tableConsultee.invites.map((inv) => (
                <li
                  key={inv.id_invite}
                  className='rounded-lg border border-border px-3 py-2 text-sm'
                >
                  <span className='font-medium'>{inv.nom_complet}</span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </FeuilleModale>
    </div>
  )
}

/** Page tables de l’événement actif. */
export function PageTables() {
  const { estMobile } = useEcran()

  return (
    <>
      <EnTeteOrganisateur
        titre='Tables'
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
        <ContenuTables />
      </GardeEvenementActif>
    </>
  )
}
