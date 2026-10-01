import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  Loader2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import type { Evenement, TypeEvenement } from '@/types'
import {
  creerEvenement,
  listerEvenementsOrganisateur,
  modifierEvenement,
  supprimerEvenement,
  type DonneesEvenement,
} from '@/services/evenements'
import { useAuthentification } from '@/hooks/use-authentification'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useEcran } from '@/hooks/use-ecran'
import { formaterDate, libelleTypeEvenement } from '@/lib/formatage'
import {
  afficherErreur,
  afficherSucces,
  apresFermetureOverlay,
  demanderConfirmation,
} from '@/lib/alertes'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const TYPES_EVENEMENT = ['mariage', 'anniversaire'] as const satisfies readonly TypeEvenement[]

const schemaEvenement = z.object({
  nom_evenement: z.string().min(1, 'Le nom est obligatoire.'),
  type_evenement: z.enum(TYPES_EVENEMENT),
  date_evenement: z.string().min(1, 'La date est obligatoire.'),
  heure_evenement: z
    .string()
    .min(1, "L'heure est obligatoire.")
    .regex(/^\d{2}:\d{2}$/, 'Format attendu : HH:MM'),
  lieu: z.string().min(1, 'Le lieu est obligatoire.'),
})

type DonneesFormulaireEvenement = z.infer<typeof schemaEvenement>

/** Valeurs vides du formulaire événement. */
function valeursParDefaut(): DonneesFormulaireEvenement {
  return {
    nom_evenement: '',
    type_evenement: 'mariage',
    date_evenement: '',
    heure_evenement: '19:00',
    lieu: '',
  }
}

/** Convertit un événement en valeurs de formulaire. */
function evenementVersFormulaire(
  evenement: Evenement
): DonneesFormulaireEvenement {
  return {
    nom_evenement: evenement.nom_evenement,
    type_evenement: evenement.type_evenement,
    date_evenement: evenement.date_evenement.slice(0, 10),
    heure_evenement: evenement.heure_evenement,
    lieu: evenement.lieu,
  }
}

/** Filtre les événements selon une recherche textuelle. */
function filtrerEvenements(
  liste: Evenement[],
  recherche: string
): Evenement[] {
  const terme = recherche.trim().toLowerCase()
  if (!terme) return liste
  return liste.filter((evt) => {
    const bloc = [
      evt.nom_evenement,
      evt.lieu,
      libelleTypeEvenement(evt.type_evenement),
    ]
      .join(' ')
      .toLowerCase()
    return bloc.includes(terme)
  })
}

/** Page Mes événements (liste, CRUD, événement actif). */
export function PageMesEvenements() {
  const utilisateur = useAuthentification((e) => e.utilisateur)
  const { evenementActif, definirEvenementActif, aLeDroit } = useEvenementActif()
  const { estMobile } = useEcran()
  const clientRequetes = useQueryClient()

  const [recherche, definirRecherche] = useState('')
  const [modaleOuverte, definirModaleOuverte] = useState(false)
  const [evenementEdite, definirEvenementEdite] = useState<Evenement | null>(
    null
  )

  const requete = useQuery({
    queryKey: ['evenements-organisateur', utilisateur?.id_utilisateur],
    queryFn: () => listerEvenementsOrganisateur(utilisateur!.id_utilisateur),
    enabled: Boolean(utilisateur),
  })

  const formulaire = useForm<DonneesFormulaireEvenement>({
    resolver: zodResolver(schemaEvenement),
    defaultValues: valeursParDefaut(),
  })

  useEffect(() => {
    if (modaleOuverte) {
      formulaire.reset(
        evenementEdite
          ? evenementVersFormulaire(evenementEdite)
          : valeursParDefaut()
      )
    }
  }, [modaleOuverte, evenementEdite, formulaire])

  const invaliderListes = async () => {
    await clientRequetes.invalidateQueries({
      queryKey: ['evenements-organisateur'],
    })
    await clientRequetes.invalidateQueries({
      queryKey: ['stats-organisateur'],
    })
  }

  /** Ferme le formulaire événement puis exécute une alerte. */
  const alerteApresFormulaire = async (
    action: () => Promise<void>
  ): Promise<void> => {
    await apresFermetureOverlay(() => {
      definirModaleOuverte(false)
      definirEvenementEdite(null)
    }, action)
  }

  const mutationCreer = useMutation({
    mutationFn: (donnees: DonneesEvenement) =>
      creerEvenement(utilisateur!.id_utilisateur, donnees),
    onSuccess: async (nouveau) => {
      await invaliderListes()
      definirEvenementActif(nouveau)
      await alerteApresFormulaire(async () => {
        await afficherSucces('Événement créé', nouveau.nom_evenement)
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
      donnees: DonneesEvenement
    }) => modifierEvenement(id, donnees),
    onSuccess: async (misAJour) => {
      await invaliderListes()
      if (evenementActif?.id_evenement === misAJour.id_evenement) {
        definirEvenementActif(misAJour)
      }
      await alerteApresFormulaire(async () => {
        await afficherSucces('Événement modifié')
      })
    },
    onError: async (erreur: Error) => {
      await alerteApresFormulaire(async () => {
        await afficherErreur('Modification impossible', erreur.message)
      })
    },
  })

  const mutationSupprimer = useMutation({
    mutationFn: supprimerEvenement,
    onSuccess: async (_, idSupprime) => {
      await invaliderListes()
      if (evenementActif?.id_evenement === idSupprime) {
        definirEvenementActif(null)
      }
      await afficherSucces('Événement supprimé')
    },
    onError: async (erreur: Error) => {
      await afficherErreur('Suppression impossible', erreur.message)
    },
  })

  const evenementsFiltres = useMemo(() => {
    if (!requete.data) return []
    return filtrerEvenements(requete.data, recherche).sort(
      (a, b) =>
        new Date(b.date_evenement).getTime() -
        new Date(a.date_evenement).getTime()
    )
  }, [requete.data, recherche])

  /** Ouvre la modale de création. */
  const ouvrirCreation = () => {
    definirEvenementEdite(null)
    definirModaleOuverte(true)
  }

  /** Ouvre la modale d’édition. */
  const ouvrirEdition = (evenement: Evenement) => {
    definirEvenementEdite(evenement)
    definirModaleOuverte(true)
  }

  /** Définit l’événement comme actif. */
  const ouvrirEvenement = (evenement: Evenement) => {
    definirEvenementActif(evenement)
  }

  /** Demande confirmation puis supprime si propriétaire. */
  const confirmerSuppression = async (evenement: Evenement) => {
    if (utilisateur?.id_utilisateur !== evenement.id_utilisateur_proprietaire) {
      return
    }
    const ok = await demanderConfirmation({
      titre: 'Supprimer cet événement ?',
      texte: 'Cette action est irréversible (invités, tables, affectations).',
      destructif: true,
      boutonConfirmer: 'Supprimer',
    })
    if (ok) {
      mutationSupprimer.mutate(evenement.id_evenement)
    }
  }

  /** Soumet le formulaire création / édition. */
  const soumettreFormulaire = (donnees: DonneesFormulaireEvenement) => {
    const payload: DonneesEvenement = { ...donnees }
    if (evenementEdite) {
      mutationModifier.mutate({
        id: evenementEdite.id_evenement,
        donnees: payload,
      })
    } else {
      mutationCreer.mutate(payload)
    }
  }

  const enCours =
    mutationCreer.isPending ||
    mutationModifier.isPending ||
    mutationSupprimer.isPending

  /** Rendu des actions par ligne (menu). */
  const actionsLigne = (evenement: Evenement) => {
    const estProprietaire =
      utilisateur?.id_utilisateur === evenement.id_utilisateur_proprietaire
    const peutSupprimer =
      estProprietaire && aLeDroit('supprimer_evenement')

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-11 shrink-0 sm:size-9'
            aria-label='Actions'
          >
            <MoreHorizontal className='size-5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={() => ouvrirEvenement(evenement)}>
            Ouvrir (événement actif)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => ouvrirEdition(evenement)}>
            <Pencil className='me-2 size-4' />
            Modifier
          </DropdownMenuItem>
          {peutSupprimer ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={() => void confirmerSuppression(evenement)}
              >
                <Trash2 className='me-2 size-4' />
                Supprimer
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <EnTeteOrganisateur
        titre='Mes événements'
        actions={
          !estMobile ? (
            <>
              <Button type='button' onClick={ouvrirCreation} className='gap-2'>
                <Plus className='size-4' />
                Créer
              </Button>
              <ThemeSwitch />
              <ProfileDropdown />
            </>
          ) : null
        }
      />

      <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
        <div className='relative'>
          <Search
            className='pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden
          />
          <Input
            type='search'
            placeholder='Rechercher un événement…'
            value={recherche}
            onChange={(e) => definirRecherche(e.target.value)}
            className='min-h-11 ps-9'
            aria-label='Rechercher'
          />
        </div>

        {requete.isLoading ? <SquelettePage /> : null}
        {requete.isError ? (
          <EtatErreur
            message='Impossible de charger vos événements.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {!requete.isLoading && !requete.isError && requete.data ? (
          evenementsFiltres.length === 0 ? (
            <EtatVide
              titre='Aucun événement'
              description='Créez votre premier événement pour commencer.'
              action={
                <Button type='button' onClick={ouvrirCreation}>
                  Créer un événement
                </Button>
              }
            />
          ) : (
            <ListeAdaptative
              donnees={evenementsFiltres}
              cleLigne={(evt) => evt.id_evenement}
              onLigneClic={ouvrirEvenement}
              colonnes={[
                {
                  cle: 'nom',
                  libelle: 'Nom',
                  cellule: (evt) => (
                    <div className='flex flex-col gap-0.5'>
                      <span className='font-medium'>{evt.nom_evenement}</span>
                      <span className='text-xs text-muted-foreground'>
                        {libelleTypeEvenement(evt.type_evenement)}
                      </span>
                    </div>
                  ),
                },
                {
                  cle: 'date',
                  libelle: 'Date',
                  cellule: (evt) => (
                    <span>
                      {formaterDate(evt.date_evenement)} · {evt.heure_evenement}
                    </span>
                  ),
                },
                {
                  cle: 'lieu',
                  libelle: 'Lieu',
                  cellule: (evt) => evt.lieu,
                },
                {
                  cle: 'actif',
                  libelle: 'Actif',
                  cellule: (evt) =>
                    evenementActif?.id_evenement === evt.id_evenement ? (
                      <span className='text-xs font-medium text-primary'>
                        Sélectionné
                      </span>
                    ) : (
                      '—'
                    ),
                },
                {
                  cle: 'actions',
                  libelle: '',
                  cellule: (evt) => actionsLigne(evt),
                },
              ]}
              renduCarte={(evt) => (
                <article
                  className={cn(
                    'rounded-xl border border-border bg-card p-4 shadow-xs transition-colors duration-150',
                    evenementActif?.id_evenement === evt.id_evenement &&
                      'ring-2 ring-primary/30'
                  )}
                >
                  <div className='flex items-start gap-2'>
                    <button
                      type='button'
                      className='min-h-11 flex-1 text-left'
                      onClick={() => ouvrirEvenement(evt)}
                    >
                      <h2 className='font-semibold text-foreground'>
                        {evt.nom_evenement}
                      </h2>
                      <p className='text-sm text-muted-foreground'>
                        {libelleTypeEvenement(evt.type_evenement)}
                      </p>
                      <p className='mt-2 flex items-center gap-2 text-sm text-muted-foreground'>
                        <CalendarDays className='size-4 shrink-0 text-primary' />
                        {formaterDate(evt.date_evenement)} · {evt.heure_evenement}
                      </p>
                      <p className='mt-1 flex items-start gap-2 text-sm text-muted-foreground'>
                        <MapPin className='mt-0.5 size-4 shrink-0 text-primary' />
                        <span className='line-clamp-2'>{evt.lieu}</span>
                      </p>
                    </button>
                    {actionsLigne(evt)}
                  </div>
                </article>
              )}
            />
          )
        ) : null}
      </div>

      <BoutonActionFlottant libelle='Créer un événement' onClick={ouvrirCreation} />

      <FeuilleModale
        ouvert={modaleOuverte}
        onFermer={() => {
          if (!enCours) {
            definirModaleOuverte(false)
            definirEvenementEdite(null)
          }
        }}
        titre={evenementEdite ? 'Modifier l’événement' : 'Nouvel événement'}
        description='Nom, type, date, heure et lieu.'
        pleinEcranMobile
      >
        <Form {...formulaire}>
          <form
            onSubmit={formulaire.handleSubmit(soumettreFormulaire)}
            className='flex flex-col gap-4'
          >
            <FormField
              control={formulaire.control}
              name='nom_evenement'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l’événement</FormLabel>
                  <FormControl>
                    <Input {...field} className='min-h-11' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulaire.control}
              name='type_evenement'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className='min-h-11 w-full'>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TYPES_EVENEMENT.map((type) => (
                        <SelectItem key={type} value={type}>
                          {libelleTypeEvenement(type)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={formulaire.control}
                name='date_evenement'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} className='min-h-11' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={formulaire.control}
                name='heure_evenement'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heure</FormLabel>
                    <FormControl>
                      <Input type='time' {...field} className='min-h-11' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={formulaire.control}
              name='lieu'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu</FormLabel>
                  <FormControl>
                    <Input {...field} className='min-h-11' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end'>
              <Button
                type='button'
                variant='outline'
                className='min-h-11'
                disabled={enCours}
                onClick={() => {
                  definirModaleOuverte(false)
                  definirEvenementEdite(null)
                }}
              >
                Annuler
              </Button>
              <Button type='submit' className='min-h-11' disabled={enCours}>
                {enCours ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : evenementEdite ? (
                  'Enregistrer'
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </FeuilleModale>
    </>
  )
}
