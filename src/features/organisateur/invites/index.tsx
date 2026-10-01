import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
import {
  Download,
  FileUp,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import type { TypeInvitation } from '@/types'
import {
  creerGroupeInvites,
  importerInvites,
  listerBlocsInvites,
  modifierInvite,
  supprimerInvite,
  type BlocInvite,
  type DonneesInvite,
} from '@/services/invites'
import { affecterGroupeParInvitation, listerTables } from '@/services/tables'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useEcran } from '@/hooks/use-ecran'
import {
  afficherErreur,
  afficherSucces,
  apresFermetureOverlay,
  demanderConfirmation,
} from '@/lib/alertes'
import { libelleTable } from '@/lib/formatage'
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
import { BadgeStatut } from '@/components/badge-statut'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const schemaCreation = z
  .object({
    type_invitation: z.enum(['seul', 'couple', 'famille', 'groupe']),
    nom_seul: z.string().optional(),
    nom_a: z.string().optional(),
    nom_b: z.string().optional(),
    libelle_groupe: z.string().optional(),
    membres: z.array(z.object({ nom: z.string() })).optional(),
    id_table: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type_invitation === 'seul') {
      if (!val.nom_seul?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Le nom complet est obligatoire.',
          path: ['nom_seul'],
        })
      }
    } else if (val.type_invitation === 'couple') {
      if (!val.nom_a?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Le premier nom est obligatoire.',
          path: ['nom_a'],
        })
      }
      if (!val.nom_b?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Le second nom est obligatoire.',
          path: ['nom_b'],
        })
      }
    } else {
      if (!val.libelle_groupe?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'Le nom du groupe / de la famille est obligatoire.',
          path: ['libelle_groupe'],
        })
      }
      const membres = (val.membres ?? [])
        .map((m) => m.nom.trim())
        .filter(Boolean)
      if (membres.length < 2) {
        ctx.addIssue({
          code: 'custom',
          message: 'Ajoutez au moins deux membres.',
          path: ['membres'],
        })
      }
    }
  })

type DonneesFormulaireCreation = z.infer<typeof schemaCreation>

const schemaEdition = z.object({
  nom_complet: z.string().min(1, 'Le nom complet est obligatoire.'),
})

type DonneesEdition = z.infer<typeof schemaEdition>

type FiltreInvite = 'tous' | 'present' | 'absent' | 'affecte' | 'non_affecte'

type LigneImport = DonneesInvite & { numeroLigne: number }

type ErreurLigneImport = { numeroLigne: number; message: string }

/** Libellé court du type d’invitation. */
function libelleType(type: TypeInvitation): string {
  if (type === 'seul') return 'Seul'
  if (type === 'couple') return 'Couple'
  if (type === 'famille') return 'Famille'
  return 'Groupe'
}

/** Valeurs vides du formulaire de création. */
function valeursParDefautCreation(): DonneesFormulaireCreation {
  return {
    type_invitation: 'seul',
    nom_seul: '',
    nom_a: '',
    nom_b: '',
    libelle_groupe: '',
    membres: [{ nom: '' }, { nom: '' }],
    id_table: '',
  }
}

/** Filtre les blocs selon recherche et filtre statut. */
function filtrerBlocs(
  liste: BlocInvite[],
  recherche: string,
  filtre: FiltreInvite
): BlocInvite[] {
  const terme = recherche.trim().toLowerCase()
  return liste.filter((bloc) => {
    if (filtre === 'present' && bloc.statut_presence !== 'present') return false
    if (filtre === 'absent' && bloc.statut_presence !== 'absent') return false
    if (filtre === 'affecte' && bloc.id_table === null) return false
    if (filtre === 'non_affecte' && bloc.id_table !== null) return false
    if (!terme) return true
    return (
      bloc.libelle.toLowerCase().includes(terme) ||
      bloc.invites.some((i) => i.nom_complet.toLowerCase().includes(terme))
    )
  })
}

/** Valide une ligne CSV d’invité. */
function validerLigneCsv(
  brut: Record<string, string>,
  numeroLigne: number
): { donnees?: DonneesInvite; erreur?: ErreurLigneImport } {
  const nom_complet = (brut.nom_complet ?? '').trim()
  if (!nom_complet) {
    return {
      erreur: { numeroLigne, message: 'Nom complet obligatoire.' },
    }
  }
  return { donnees: { nom_complet } }
}

/** Télécharge le modèle CSV invités. */
function telechargerModeleCsv(): void {
  const contenu = 'nom_complet\nJean Dupont\nMarie Martin\n'
  const blob = new Blob([contenu], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = 'modele-invites-eventqr.csv'
  lien.click()
  URL.revokeObjectURL(url)
}

/** Contenu principal page invités (blocs indivisibles). */
function ContenuInvites() {
  const { evenementActif, aLeDroit } = useEvenementActif()
  const { estMobile } = useEcran()
  const clientRequetes = useQueryClient()
  const idEvenement = evenementActif!.id_evenement

  const [recherche, definirRecherche] = useState('')
  const [filtre, definirFiltre] = useState<FiltreInvite>('tous')
  const [modaleFormulaire, definirModaleFormulaire] = useState(false)
  const [modaleEdition, definirModaleEdition] = useState(false)
  const [modaleImport, definirModaleImport] = useState(false)
  const [modaleAffecter, definirModaleAffecter] = useState(false)
  const [blocEdite, definirBlocEdite] = useState<BlocInvite | null>(null)
  const [inviteEditionId, definirInviteEditionId] = useState<string | null>(
    null
  )
  const [blocAAffecter, definirBlocAAffecter] = useState<BlocInvite | null>(
    null
  )
  const [tableChoisieAffectation, definirTableChoisieAffectation] = useState('')
  const [lignesValides, definirLignesValides] = useState<LigneImport[]>([])
  const [erreursImport, definirErreursImport] = useState<ErreurLigneImport[]>(
    []
  )

  const peutGerer = aLeDroit('gerer_invites')

  const requete = useQuery({
    queryKey: ['blocs-invites', idEvenement],
    queryFn: () => listerBlocsInvites(idEvenement),
  })

  const requeteTables = useQuery({
    queryKey: ['tables', idEvenement],
    queryFn: () => listerTables(idEvenement),
  })

  const formulaire = useForm<DonneesFormulaireCreation>({
    resolver: zodResolver(schemaCreation),
    defaultValues: valeursParDefautCreation(),
  })

  const { fields, append, remove } = useFieldArray({
    control: formulaire.control,
    name: 'membres',
  })

  const formulaireEdition = useForm<DonneesEdition>({
    resolver: zodResolver(schemaEdition),
    defaultValues: { nom_complet: '' },
  })

  const typeActuel = formulaire.watch('type_invitation')

  useEffect(() => {
    if (modaleFormulaire) {
      formulaire.reset(valeursParDefautCreation())
    }
  }, [modaleFormulaire, formulaire])

  /** Invalide les caches liés. */
  const invalider = async () => {
    await clientRequetes.invalidateQueries({
      queryKey: ['blocs-invites', idEvenement],
    })
    await clientRequetes.invalidateQueries({ queryKey: ['invites', idEvenement] })
    await clientRequetes.invalidateQueries({ queryKey: ['tables', idEvenement] })
    await clientRequetes.invalidateQueries({
      queryKey: ['invitations', idEvenement],
    })
    await clientRequetes.invalidateQueries({ queryKey: ['stats-organisateur'] })
  }

  /** Ferme la création puis exécute une action. */
  const apresCreation = async (action: () => Promise<void>): Promise<void> => {
    await apresFermetureOverlay(() => {
      definirModaleFormulaire(false)
    }, action)
  }

  const mutationCreer = useMutation({
    mutationFn: (donnees: DonneesFormulaireCreation) => {
      const type = donnees.type_invitation
      let noms: string[] = []
      if (type === 'seul') noms = [donnees.nom_seul!.trim()]
      else if (type === 'couple')
        noms = [donnees.nom_a!.trim(), donnees.nom_b!.trim()]
      else
        noms = (donnees.membres ?? [])
          .map((m) => m.nom.trim())
          .filter(Boolean)

      return creerGroupeInvites(idEvenement, {
        type_invitation: type,
        noms,
        libelle_groupe: donnees.libelle_groupe,
        id_table: donnees.id_table || undefined,
      })
    },
    onSuccess: async () => {
      await invalider()
      await apresCreation(async () => {
        await afficherSucces('Invité / groupe créé')
      })
    },
    onError: async (erreur: Error) => {
      await apresCreation(async () => {
        await afficherErreur('Ajout impossible', erreur.message)
      })
    },
  })

  const mutationModifier = useMutation({
    mutationFn: ({
      id,
      donnees,
    }: {
      id: string
      donnees: DonneesInvite
    }) => modifierInvite(id, donnees),
    onSuccess: async () => {
      await invalider()
      await apresFermetureOverlay(() => {
        definirModaleEdition(false)
        definirBlocEdite(null)
        definirInviteEditionId(null)
      }, async () => {
        await afficherSucces('Invité modifié')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirModaleEdition(false)
      }, async () => {
        await afficherErreur('Modification impossible', erreur.message)
      })
    },
  })

  const mutationSupprimer = useMutation({
    mutationFn: supprimerInvite,
    onSuccess: async () => {
      await invalider()
      await afficherSucces('Supprimé')
    },
    onError: async (erreur: Error) => {
      await afficherErreur('Suppression impossible', erreur.message)
    },
  })

  const mutationImport = useMutation({
    mutationFn: (lignes: DonneesInvite[]) =>
      importerInvites(idEvenement, lignes),
    onSuccess: async () => {
      await invalider()
      await apresFermetureOverlay(() => {
        definirModaleImport(false)
        definirLignesValides([])
        definirErreursImport([])
      }, async () => {
        await afficherSucces('Import terminé')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirModaleImport(false)
      }, async () => {
        await afficherErreur('Import impossible', erreur.message)
      })
    },
  })

  const mutationAffecter = useMutation({
    mutationFn: ({
      idInvitation,
      idTable,
    }: {
      idInvitation: string
      idTable: string
    }) => affecterGroupeParInvitation(idInvitation, idTable),
    onSuccess: async () => {
      await invalider()
      await apresFermetureOverlay(() => {
        definirModaleAffecter(false)
        definirBlocAAffecter(null)
        definirTableChoisieAffectation('')
      }, async () => {
        await afficherSucces('Groupe affecté')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirModaleAffecter(false)
        definirBlocAAffecter(null)
        definirTableChoisieAffectation('')
      }, async () => {
        await afficherErreur('Affectation impossible', erreur.message)
      })
    },
  })

  const blocsFiltres = useMemo(() => {
    if (!requete.data) return []
    return filtrerBlocs(requete.data, recherche, filtre).sort((a, b) =>
      a.libelle.localeCompare(b.libelle, 'fr')
    )
  }, [requete.data, recherche, filtre])

  const tablesDisponibles = useMemo(() => {
    const placesMin = blocAAffecter?.places ?? 1
    return (requeteTables.data ?? []).filter(
      (t) => t.places_disponibles >= placesMin
    )
  }, [requeteTables.data, blocAAffecter])

  const tablesPourCreation = useMemo(() => {
    const type = typeActuel
    let places = 1
    if (type === 'couple') places = 2
    else if (type === 'famille' || type === 'groupe') {
      places = Math.max(
        2,
        (formulaire.watch('membres') ?? []).filter((m) => m.nom.trim()).length
      )
    }
    return (requeteTables.data ?? []).filter(
      (t) => t.places_disponibles >= places
    )
  }, [requeteTables.data, typeActuel, formulaire])

  /** Ouvre la création. */
  const ouvrirCreation = () => definirModaleFormulaire(true)

  /** Ouvre l’édition du premier membre (seul) ou propose le premier nom. */
  const ouvrirEdition = (bloc: BlocInvite) => {
    const premier = bloc.invites[0]
    if (!premier) return
    definirBlocEdite(bloc)
    definirInviteEditionId(premier.id_invite)
    formulaireEdition.reset({ nom_complet: premier.nom_complet })
    definirModaleEdition(true)
  }

  /** Ouvre l’affectation groupée. */
  const ouvrirAffecter = (bloc: BlocInvite) => {
    if (!bloc.id_invitation) {
      void afficherErreur(
        'Invitation manquante',
        'Ce bloc n’a pas encore d’invitation QR.'
      )
      return
    }
    definirBlocAAffecter(bloc)
    definirTableChoisieAffectation('')
    definirModaleAffecter(true)
  }

  /** Confirme la suppression du bloc entier. */
  const confirmerSuppression = async (bloc: BlocInvite) => {
    const texte =
      bloc.type_invitation === 'seul'
        ? `${bloc.libelle} sera retiré.`
        : `Tout le ${libelleType(bloc.type_invitation).toLowerCase()} « ${bloc.libelle} » (${bloc.places} personnes) sera supprimé — unité indivisible.`
    const ok = await demanderConfirmation({
      titre: 'Supprimer ?',
      texte,
      destructif: true,
    })
    if (!ok) return
    const id = bloc.invites[0]?.id_invite
    if (id) mutationSupprimer.mutate(id)
  }

  /** Soumet la création. */
  const soumettreCreation = (donnees: DonneesFormulaireCreation) => {
    mutationCreer.mutate(donnees)
  }

  /** Soumet l’édition d’un nom. */
  const soumettreEdition = (donnees: DonneesEdition) => {
    if (!inviteEditionId) return
    mutationModifier.mutate({
      id: inviteEditionId,
      donnees: { nom_complet: donnees.nom_complet.trim() },
    })
  }

  /** Confirme l’affectation. */
  const confirmerAffectation = () => {
    if (!blocAAffecter?.id_invitation || !tableChoisieAffectation) {
      void afficherErreur(
        'Table requise',
        'Choisissez une table avec assez de places.'
      )
      return
    }
    mutationAffecter.mutate({
      idInvitation: blocAAffecter.id_invitation,
      idTable: tableChoisieAffectation,
    })
  }

  /** Analyse un fichier CSV. */
  const traiterFichierCsv = (fichier: File) => {
    Papa.parse<Record<string, string>>(fichier, {
      header: true,
      skipEmptyLines: true,
      complete: (resultat) => {
        if (resultat.errors.length > 0) {
          void afficherErreur(
            'Fichier illisible',
            'Le CSV n’a pas pu être analysé.'
          )
          return
        }
        const valides: LigneImport[] = []
        const erreurs: ErreurLigneImport[] = []
        resultat.data.forEach((ligne, index) => {
          const numeroLigne = index + 2
          const verif = validerLigneCsv(ligne, numeroLigne)
          if (verif.erreur) erreurs.push(verif.erreur)
          else if (verif.donnees)
            valides.push({ ...verif.donnees, numeroLigne })
        })
        definirLignesValides(valides)
        definirErreursImport(erreurs)
      },
    })
  }

  const enCoursFormulaire = mutationCreer.isPending

  /** Menu actions d’un bloc. */
  const menuActions = (bloc: BlocInvite) =>
    peutGerer ? (
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
          {bloc.id_table === null && bloc.id_invitation ? (
            <DropdownMenuItem onClick={() => ouvrirAffecter(bloc)}>
              <UserPlus className='me-2 size-4' />
              Affecter
            </DropdownMenuItem>
          ) : null}
          {bloc.type_invitation === 'seul' ? (
            <DropdownMenuItem onClick={() => ouvrirEdition(bloc)}>
              <Pencil className='me-2 size-4' />
              Modifier
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => void confirmerSuppression(bloc)}
          >
            <Trash2 className='me-2 size-4' />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
        <div className='relative flex-1'>
          <Search
            className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden
          />
          <Input
            type='search'
            placeholder='Rechercher…'
            value={recherche}
            onChange={(e) => definirRecherche(e.target.value)}
            className='min-h-11 ps-9'
          />
        </div>
        {peutGerer && !estMobile ? (
          <div className='flex flex-wrap gap-2'>
            <Button type='button' variant='outline' onClick={telechargerModeleCsv}>
              <Download className='me-2 size-4' />
              Modèle CSV
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => definirModaleImport(true)}
            >
              <FileUp className='me-2 size-4' />
              Importer
            </Button>
            <Button type='button' onClick={ouvrirCreation}>
              <Plus className='me-2 size-4' />
              Ajouter
            </Button>
          </div>
        ) : null}
      </div>

      <Tabs
        value={filtre}
        onValueChange={(v) => definirFiltre(v as FiltreInvite)}
      >
        <TabsList className='flex h-auto min-h-11 w-full flex-wrap justify-start gap-1'>
          <TabsTrigger value='tous'>Tous</TabsTrigger>
          <TabsTrigger value='present'>Présents</TabsTrigger>
          <TabsTrigger value='absent'>Absents</TabsTrigger>
          <TabsTrigger value='affecte'>Affectés</TabsTrigger>
          <TabsTrigger value='non_affecte'>Non affectés</TabsTrigger>
        </TabsList>
      </Tabs>

      {requete.isLoading ? <SquelettePage /> : null}
      {requete.isError ? (
        <EtatErreur
          message='Impossible de charger les invités.'
          onReessayer={() => void requete.refetch()}
        />
      ) : null}

      {!requete.isLoading && !requete.isError && requete.data ? (
        blocsFiltres.length === 0 ? (
          <EtatVide
            titre='Aucun invité'
            description='Ajoutez un seul, un couple ou une famille / groupe.'
            action={
              peutGerer ? (
                <Button type='button' onClick={ouvrirCreation}>
                  Ajouter
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ListeAdaptative
            donnees={blocsFiltres}
            cleLigne={(b) => b.cle}
            colonnes={[
              {
                cle: 'libelle',
                libelle: 'Invitation',
                cellule: (b) => (
                  <div className='min-w-0'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='font-medium'>{b.libelle}</span>
                      <BadgeStatut
                        variante='info'
                        libelle={libelleType(b.type_invitation)}
                      />
                    </div>
                    {b.type_invitation !== 'seul' ? (
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {b.invites.map((i) => i.nom_complet).join(' · ')}
                      </p>
                    ) : null}
                  </div>
                ),
              },
              {
                cle: 'places',
                libelle: 'Places',
                cellule: (b) => <span>{b.places}</span>,
              },
              {
                cle: 'presence',
                libelle: 'Présence',
                cellule: (b) => (
                  <BadgeStatut
                    variante={
                      b.statut_presence === 'present' ? 'present' : 'absent'
                    }
                  />
                ),
              },
              {
                cle: 'table',
                libelle: 'Table',
                cellule: (b) =>
                  b.numero_table !== null ? (
                    <BadgeStatut
                      variante='info'
                      libelle={libelleTable(b.numero_table, b.nom_table)}
                    />
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  ),
              },
              {
                cle: 'qr',
                libelle: 'QR',
                cellule: (b) =>
                  b.code_qr ? (
                    <span className='font-mono text-xs'>{b.code_qr}</span>
                  ) : (
                    <span className='text-muted-foreground'>—</span>
                  ),
              },
              {
                cle: 'actions',
                libelle: '',
                cellule: (b) => (
                  <div className='flex items-center justify-end gap-1'>
                    {peutGerer && b.id_table === null && b.id_invitation ? (
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='min-h-9'
                        onClick={() => ouvrirAffecter(b)}
                      >
                        Affecter
                      </Button>
                    ) : null}
                    {menuActions(b)}
                  </div>
                ),
              },
            ]}
            renduCarte={(b) => (
              <article className='rounded-xl border border-border bg-card p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='font-semibold'>{b.libelle}</p>
                      <BadgeStatut
                        variante='info'
                        libelle={libelleType(b.type_invitation)}
                      />
                    </div>
                    {b.type_invitation !== 'seul' ? (
                      <p className='mt-1 text-sm text-muted-foreground'>
                        {b.invites.map((i) => i.nom_complet).join(' · ')}
                      </p>
                    ) : null}
                    <div className='mt-2 flex flex-wrap gap-2'>
                      <BadgeStatut
                        variante={
                          b.statut_presence === 'present' ? 'present' : 'absent'
                        }
                      />
                      <span className='text-xs text-muted-foreground'>
                        {b.places} place{b.places > 1 ? 's' : ''}
                      </span>
                      {b.numero_table !== null ? (
                        <BadgeStatut
                          variante='info'
                          libelle={libelleTable(b.numero_table, b.nom_table)}
                        />
                      ) : null}
                    </div>
                    {b.code_qr ? (
                      <p className='mt-2 font-mono text-xs text-muted-foreground'>
                        {b.code_qr}
                      </p>
                    ) : null}
                    {peutGerer && b.id_table === null && b.id_invitation ? (
                      <Button
                        type='button'
                        size='sm'
                        className='mt-3 min-h-11'
                        onClick={() => ouvrirAffecter(b)}
                      >
                        <UserPlus className='me-2 size-4' />
                        Affecter à une table
                      </Button>
                    ) : null}
                  </div>
                  {menuActions(b)}
                </div>
              </article>
            )}
          />
        )
      ) : null}

      {peutGerer ? (
        <>
          <BoutonActionFlottant libelle='Ajouter' onClick={ouvrirCreation} />
          {estMobile ? (
            <div className='flex gap-2 pb-2'>
              <Button
                type='button'
                variant='outline'
                className='min-h-11 flex-1'
                onClick={telechargerModeleCsv}
              >
                Modèle
              </Button>
              <Button
                type='button'
                variant='outline'
                className='min-h-11 flex-1'
                onClick={() => definirModaleImport(true)}
              >
                Importer
              </Button>
            </div>
          ) : null}
        </>
      ) : null}

      <FeuilleModale
        ouvert={modaleFormulaire}
        onFermer={() => {
          if (!enCoursFormulaire) definirModaleFormulaire(false)
        }}
        titre='Nouvel invité / groupe'
        description='Seul, couple ou famille — une invitation QR est créée automatiquement.'
        pleinEcranMobile
      >
        <Form {...formulaire}>
          <form
            onSubmit={formulaire.handleSubmit(soumettreCreation)}
            className='flex flex-col gap-4'
          >
            <FormField
              control={formulaire.control}
              name='type_invitation'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange(v as TypeInvitation)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className='min-h-11 w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='seul'>Seul</SelectItem>
                      <SelectItem value='couple'>Couple</SelectItem>
                      <SelectItem value='famille'>Famille</SelectItem>
                      <SelectItem value='groupe'>Groupe</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {typeActuel === 'seul' ? (
              <FormField
                control={formulaire.control}
                name='nom_seul'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='Ex. Jean Dupont'
                        className='min-h-11'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {typeActuel === 'couple' ? (
              <>
                <FormField
                  control={formulaire.control}
                  name='nom_a'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personne 1</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='Nom complet'
                          className='min-h-11'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formulaire.control}
                  name='nom_b'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personne 2</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder='Nom complet'
                          className='min-h-11'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            {typeActuel === 'famille' || typeActuel === 'groupe' ? (
              <>
                <FormField
                  control={formulaire.control}
                  name='libelle_groupe'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nom{' '}
                        {typeActuel === 'famille' ? 'de la famille' : 'du groupe'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={
                            typeActuel === 'famille'
                              ? 'Ex. Famille Mwamba'
                              : 'Ex. Équipe Marketing'
                          }
                          className='min-h-11'
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='space-y-3'>
                  <FormLabel>Membres</FormLabel>
                  {fields.map((champ, index) => (
                    <FormField
                      key={champ.id}
                      control={formulaire.control}
                      name={`membres.${index}.nom`}
                      render={({ field }) => (
                        <FormItem>
                          <div className='flex gap-2'>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={`Membre ${index + 1}`}
                                className='min-h-11'
                              />
                            </FormControl>
                            {fields.length > 2 ? (
                              <Button
                                type='button'
                                variant='ghost'
                                size='icon'
                                className='size-11 shrink-0'
                                onClick={() => remove(index)}
                                aria-label='Retirer'
                              >
                                <X className='size-4' />
                              </Button>
                            ) : null}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    className='min-h-11'
                    onClick={() => append({ nom: '' })}
                  >
                    <Plus className='me-2 size-4' />
                    Ajouter un membre
                  </Button>
                </div>
              </>
            ) : null}

            <FormField
              control={formulaire.control}
              name='id_table'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table (optionnel)</FormLabel>
                  <Select
                    value={field.value || '__aucune__'}
                    onValueChange={(v) =>
                      field.onChange(v === '__aucune__' ? '' : v)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className='min-h-11 w-full'>
                        <SelectValue placeholder='Ne pas affecter' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='__aucune__'>Ne pas affecter</SelectItem>
                      {tablesPourCreation.map((t) => (
                        <SelectItem key={t.id_table} value={t.id_table}>
                          {libelleTable(t.numero_table, t.nom_table)} (
                          {t.places_disponibles} libre
                          {t.places_disponibles > 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-xs text-muted-foreground'>
                    Couple / famille / groupe : tout le monde à la même table.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type='submit'
              className='min-h-11'
              disabled={enCoursFormulaire}
            >
              {enCoursFormulaire ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                'Créer (avec QR)'
              )}
            </Button>
          </form>
        </Form>
      </FeuilleModale>

      <FeuilleModale
        ouvert={modaleEdition}
        onFermer={() => {
          if (!mutationModifier.isPending) {
            definirModaleEdition(false)
            definirBlocEdite(null)
            definirInviteEditionId(null)
          }
        }}
        titre='Modifier le nom'
        description={blocEdite?.libelle}
      >
        <Form {...formulaireEdition}>
          <form
            onSubmit={formulaireEdition.handleSubmit(soumettreEdition)}
            className='flex flex-col gap-4'
          >
            <FormField
              control={formulaireEdition.control}
              name='nom_complet'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input {...field} className='min-h-11' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='min-h-11'
              disabled={mutationModifier.isPending}
            >
              {mutationModifier.isPending ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </form>
        </Form>
      </FeuilleModale>

      <FeuilleModale
        ouvert={modaleAffecter}
        onFermer={() => {
          if (!mutationAffecter.isPending) {
            definirModaleAffecter(false)
            definirBlocAAffecter(null)
            definirTableChoisieAffectation('')
          }
        }}
        titre='Affecter à une table'
        description={
          blocAAffecter
            ? `${blocAAffecter.libelle} — ${blocAAffecter.places} place(s)`
            : undefined
        }
      >
        <div className='flex flex-col gap-4'>
          <Select
            value={tableChoisieAffectation || undefined}
            onValueChange={definirTableChoisieAffectation}
          >
            <SelectTrigger className='min-h-11 w-full'>
              <SelectValue placeholder='Choisir une table…' />
            </SelectTrigger>
            <SelectContent>
              {tablesDisponibles.map((t) => (
                <SelectItem key={t.id_table} value={t.id_table}>
                  {libelleTable(t.numero_table, t.nom_table)} (
                  {t.places_disponibles} libre
                  {t.places_disponibles > 1 ? 's' : ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tablesDisponibles.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              Aucune table avec assez de places pour ce groupe.
            </p>
          ) : null}
          <Button
            type='button'
            className='min-h-11'
            disabled={
              mutationAffecter.isPending || !tableChoisieAffectation
            }
            onClick={confirmerAffectation}
          >
            {mutationAffecter.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Affecter le groupe'
            )}
          </Button>
        </div>
      </FeuilleModale>

      <FeuilleModale
        ouvert={modaleImport}
        onFermer={() => {
          if (!mutationImport.isPending) {
            definirModaleImport(false)
            definirLignesValides([])
            definirErreursImport([])
          }
        }}
        titre='Importer des invités (CSV)'
        description='Chaque ligne = un invité seul + invitation QR'
        pleinEcranMobile
      >
        <div className='flex flex-col gap-4'>
          <Button type='button' variant='outline' onClick={telechargerModeleCsv}>
            <Download className='me-2 size-4' />
            Télécharger le modèle
          </Button>
          <Input
            type='file'
            accept='.csv,text/csv'
            className='min-h-11'
            onChange={(e) => {
              const fichier = e.target.files?.[0]
              if (fichier) traiterFichierCsv(fichier)
            }}
          />
          {erreursImport.length > 0 ? (
            <div className='rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm'>
              <p className='font-medium text-destructive'>
                {erreursImport.length} erreur(s)
              </p>
            </div>
          ) : null}
          {lignesValides.length > 0 ? (
            <p className='text-sm text-muted-foreground'>
              {lignesValides.length} ligne(s) prête(s).
            </p>
          ) : null}
          <Button
            type='button'
            className='min-h-11'
            disabled={mutationImport.isPending || lignesValides.length === 0}
            onClick={() =>
              mutationImport.mutate(
                lignesValides.map(({ numeroLigne: _n, ...d }) => d)
              )
            }
          >
            {mutationImport.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Importer'
            )}
          </Button>
        </div>
      </FeuilleModale>
    </div>
  )
}

/** Page invités de l’événement actif. */
export function PageInvites() {
  const { estMobile } = useEcran()

  return (
    <>
      <EnTeteOrganisateur
        titre='Invités'
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
        <ContenuInvites />
      </GardeEvenementActif>
    </>
  )
}
