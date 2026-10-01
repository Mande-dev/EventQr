import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Power, PowerOff } from 'lucide-react'
import type { RoleEvenement } from '@/types'
import {
  basculerActifUtilisateurEvenement,
  creerUtilisateurPourEvenement,
  listerUtilisateursEvenement,
  ROLES_CREABLES_ORGANISATEUR,
  type UtilisateurEvenementEnrichi,
} from '@/services/utilisateurs-evenement'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { useAuthentification } from '@/hooks/use-authentification'
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
import { BadgeStatut } from '@/components/badge-statut'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const schemaCreation = z.object({
  email: z.string().email('E-mail invalide.'),
  telephone: z.string().min(8, 'Téléphone obligatoire.'),
  mot_de_passe: z.string().min(8, 'Mot de passe : 8 caractères minimum.'),
  role_evenement: z.enum(['Propriétaire', 'Agent de contrôle']),
})

type DonneesCreation = z.infer<typeof schemaCreation>

/** Libellé badge selon le rôle événement. */
function varianteRole(role: RoleEvenement): 'info' | 'actif' | 'attention' {
  if (role === 'Propriétaire') return 'info'
  if (role === 'Organisateur') return 'actif'
  return 'attention'
}

/** Affiche e-mail ou nom dérivé. */
function libelleUtilisateur(ligne: UtilisateurEvenementEnrichi): string {
  const u = ligne.utilisateur
  if (!u) return 'Utilisateur inconnu'
  if (u.prenom === '—' || !u.prenom) return u.email
  return `${u.prenom} ${u.nom}`.trim()
}

/** Contenu : créer proprio/agent + activer/désactiver. */
function ContenuUtilisateursEvenement() {
  const { evenementActif, aLeDroit } = useEvenementActif()
  const utilisateurCourant = useAuthentification((e) => e.utilisateur)
  const { estMobile } = useEcran()
  const clientRequetes = useQueryClient()
  const [modaleCreation, definirModaleCreation] = useState(false)

  const idEvenement = evenementActif!.id_evenement
  const peutGerer = aLeDroit('gerer_utilisateurs_evenement')

  const formulaire = useForm<DonneesCreation>({
    resolver: zodResolver(schemaCreation),
    defaultValues: {
      email: '',
      telephone: '',
      mot_de_passe: '',
      role_evenement: 'Agent de contrôle',
    },
  })

  const requeteListe = useQuery({
    queryKey: ['utilisateurs-evenement', idEvenement],
    queryFn: () => listerUtilisateursEvenement(idEvenement),
  })

  /** Invalide la liste des utilisateurs de l’événement. */
  const invalider = async () => {
    await clientRequetes.invalidateQueries({
      queryKey: ['utilisateurs-evenement', idEvenement],
    })
  }

  useEffect(() => {
    if (modaleCreation) {
      formulaire.reset({
        email: '',
        telephone: '',
        mot_de_passe: '',
        role_evenement: 'Agent de contrôle',
      })
    }
  }, [modaleCreation, formulaire])

  const mutationCreer = useMutation({
    mutationFn: (donnees: DonneesCreation) =>
      creerUtilisateurPourEvenement(idEvenement, {
        email: donnees.email,
        telephone: donnees.telephone,
        mot_de_passe: donnees.mot_de_passe,
        role_evenement: donnees.role_evenement,
      }),
    onSuccess: async () => {
      await invalider()
      await apresFermetureOverlay(() => {
        definirModaleCreation(false)
      }, async () => {
        await afficherSucces('Compte créé')
      })
    },
    onError: async (erreur: Error) => {
      await apresFermetureOverlay(() => {
        definirModaleCreation(false)
      }, async () => {
        await afficherErreur('Création impossible', erreur.message)
      })
    },
  })

  const mutationActif = useMutation({
    mutationFn: basculerActifUtilisateurEvenement,
    onSuccess: async (utilisateur) => {
      await invalider()
      await afficherSucces(
        utilisateur.actif ? 'Compte activé' : 'Compte désactivé'
      )
    },
    onError: async (erreur: Error) => {
      await afficherErreur('Action impossible', erreur.message)
    },
  })

  const listeTriee = useMemo(() => {
    if (!requeteListe.data) return []
    const ordre: Record<RoleEvenement, number> = {
      Propriétaire: 0,
      Organisateur: 1,
      'Agent de contrôle': 2,
    }
    return [...requeteListe.data].sort(
      (a, b) => ordre[a.role_evenement] - ordre[b.role_evenement]
    )
  }, [requeteListe.data])

  /** Indique si on peut activer/désactiver cette ligne. */
  const peutBasculer = (ligne: UtilisateurEvenementEnrichi): boolean => {
    if (!peutGerer) return false
    if (!ligne.utilisateur) return false
    if (ligne.utilisateur.role_systeme === 'super_admin') return false
    if (ligne.utilisateur.id_utilisateur === utilisateurCourant?.id_utilisateur)
      return false
    return (
      ligne.role_evenement === 'Propriétaire' ||
      ligne.role_evenement === 'Agent de contrôle'
    )
  }

  /** Demande confirmation Oui/Non avant activation / désactivation. */
  const confirmerBasculerActif = async (
    ligne: UtilisateurEvenementEnrichi
  ) => {
    if (!peutBasculer(ligne) || !ligne.utilisateur) return
    const actif = ligne.utilisateur.actif
    const ok = await demanderConfirmation({
      titre: actif ? 'Désactiver ce compte ?' : 'Activer ce compte ?',
      texte: actif
        ? `${ligne.utilisateur.email} ne pourra plus se connecter.`
        : `Réactiver ${ligne.utilisateur.email} ?`,
      boutonConfirmer: 'Oui',
      boutonAnnuler: 'Non',
      destructif: actif,
      icone: 'question',
    })
    if (ok) mutationActif.mutate(ligne.utilisateur.id_utilisateur)
  }

  return (
    <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-muted-foreground'>
          Créez un propriétaire ou un agent (e-mail, téléphone, mot de passe).
          Activez ou désactivez leurs comptes. Pas de suppression.
        </p>
        {peutGerer && !estMobile ? (
          <Button type='button' onClick={() => definirModaleCreation(true)}>
            <Plus className='me-2 size-4' />
            Créer
          </Button>
        ) : null}
      </div>

      {requeteListe.isLoading ? <SquelettePage /> : null}
      {requeteListe.isError ? (
        <EtatErreur
          message='Impossible de charger les utilisateurs.'
          onReessayer={() => void requeteListe.refetch()}
        />
      ) : null}

      {!requeteListe.isLoading && !requeteListe.isError && requeteListe.data ? (
        listeTriee.length === 0 ? (
          <EtatVide
            titre='Aucun utilisateur'
            description='Ajoutez un propriétaire ou un agent de contrôle.'
            action={
              peutGerer ? (
                <Button type='button' onClick={() => definirModaleCreation(true)}>
                  Créer
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ListeAdaptative
            donnees={listeTriee}
            cleLigne={(l) => l.id_utilisateur_evenement}
            colonnes={[
              {
                cle: 'personne',
                libelle: 'Compte',
                cellule: (l) => (
                  <div className='min-w-0'>
                    <p className='font-medium'>{libelleUtilisateur(l)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {l.utilisateur?.email}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {l.utilisateur?.telephone}
                    </p>
                  </div>
                ),
              },
              {
                cle: 'role',
                libelle: 'Rôle',
                cellule: (l) => (
                  <BadgeStatut
                    variante={varianteRole(l.role_evenement)}
                    libelle={l.role_evenement}
                  />
                ),
              },
              {
                cle: 'statut',
                libelle: 'Statut',
                cellule: (l) => (
                  <BadgeStatut
                    variante={l.utilisateur?.actif ? 'actif' : 'inactif'}
                  />
                ),
              },
              {
                cle: 'actions',
                libelle: '',
                cellule: (l) =>
                  peutBasculer(l) ? (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className='min-h-9'
                      disabled={mutationActif.isPending}
                      onClick={() => void confirmerBasculerActif(l)}
                    >
                      {l.utilisateur?.actif ? (
                        <>
                          <PowerOff className='me-1 size-3.5' />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Power className='me-1 size-3.5' />
                          Activer
                        </>
                      )}
                    </Button>
                  ) : null,
              },
            ]}
            renduCarte={(l) => (
              <article className='rounded-xl border border-border bg-card p-4'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <p className='font-semibold'>{libelleUtilisateur(l)}</p>
                    <p className='text-sm text-muted-foreground'>
                      {l.utilisateur?.email}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {l.utilisateur?.telephone}
                    </p>
                    <div className='mt-2 flex flex-wrap gap-2'>
                      <BadgeStatut
                        variante={varianteRole(l.role_evenement)}
                        libelle={l.role_evenement}
                      />
                      <BadgeStatut
                        variante={l.utilisateur?.actif ? 'actif' : 'inactif'}
                      />
                    </div>
                    {peutBasculer(l) ? (
                      <Button
                        type='button'
                        variant='outline'
                        className='mt-3 min-h-11'
                        disabled={mutationActif.isPending}
                        onClick={() => void confirmerBasculerActif(l)}
                      >
                        {l.utilisateur?.actif ? 'Désactiver' : 'Activer'}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </article>
            )}
          />
        )
      ) : null}

      {peutGerer ? (
        <BoutonActionFlottant
          libelle='Créer un compte'
          onClick={() => definirModaleCreation(true)}
        />
      ) : null}

      <FeuilleModale
        ouvert={modaleCreation}
        onFermer={() => {
          if (!mutationCreer.isPending) definirModaleCreation(false)
        }}
        titre='Nouveau propriétaire / agent'
        description='E-mail, téléphone et mot de passe uniquement.'
        pleinEcranMobile
      >
        <Form {...formulaire}>
          <form
            onSubmit={formulaire.handleSubmit((d) => mutationCreer.mutate(d))}
            className='flex flex-col gap-4'
          >
            <FormField
              control={formulaire.control}
              name='role_evenement'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
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
                      {ROLES_CREABLES_ORGANISATEUR.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulaire.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='email'
                      autoComplete='off'
                      className='min-h-11'
                      placeholder='exemple@email.cd'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulaire.control}
              name='telephone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='tel'
                      className='min-h-11'
                      placeholder='+243…'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={formulaire.control}
              name='mot_de_passe'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      autoComplete='new-password'
                      className='min-h-11'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='min-h-11'
              disabled={mutationCreer.isPending}
            >
              {mutationCreer.isPending ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                'Créer le compte'
              )}
            </Button>
          </form>
        </Form>
      </FeuilleModale>
    </div>
  )
}

/** Page utilisateurs de l’événement actif. */
export function PageUtilisateursEvenement() {
  const { estMobile } = useEcran()

  return (
    <>
      <EnTeteOrganisateur
        titre='Utilisateurs'
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
        <ContenuUtilisateursEvenement />
      </GardeEvenementActif>
    </>
  )
}
