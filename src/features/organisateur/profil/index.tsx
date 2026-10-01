import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, LogOut, Save, Shield } from 'lucide-react'
import {
  afficherErreur,
  afficherSucces,
  demanderConfirmation,
} from '@/lib/alertes'
import { useAuthentification } from '@/hooks/use-authentification'
import useDialogState from '@/hooks/use-dialog-state'
import { changerMotDePasse, mettreAJourProfil } from '@/services/profil'
import { evaluerForceMotDePasse } from '@/lib/formatage'
import { cn } from '@/lib/utils'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useEcran } from '@/hooks/use-ecran'

const schemaProfil = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire.'),
  prenom: z.string().min(1, 'Le prénom est obligatoire.'),
  email: z.email({ error: 'Adresse e-mail invalide.' }),
  telephone: z.string().min(1, 'Le téléphone est obligatoire.'),
})

type DonneesProfil = z.infer<typeof schemaProfil>

const schemaMotDePasse = z
  .object({
    ancien_mot_de_passe: z
      .string()
      .min(1, 'L’ancien mot de passe est obligatoire.'),
    nouveau_mot_de_passe: z
      .string()
      .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères.'),
    confirmation_mot_de_passe: z
      .string()
      .min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine(
    (donnees) =>
      donnees.nouveau_mot_de_passe === donnees.confirmation_mot_de_passe,
    {
      message: 'Les mots de passe ne correspondent pas.',
      path: ['confirmation_mot_de_passe'],
    }
  )

type DonneesMotDePasse = z.infer<typeof schemaMotDePasse>

const LIBELLES_FORCE = [
  'Très faible',
  'Faible',
  'Moyen',
  'Fort',
  'Très fort',
] as const

type ProprietesIndicateurForce = {
  score: number
}

/** Affiche une barre de force du mot de passe sur 4 niveaux. */
function IndicateurForceMotDePasse({ score }: ProprietesIndicateurForce) {
  const scoreLimite = Math.min(Math.max(score, 0), 4)

  return (
    <div className='space-y-2' aria-live='polite'>
      <div className='flex gap-1'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full bg-muted transition-colors',
              index < scoreLimite && scoreLimite <= 1 && 'bg-destructive',
              index < scoreLimite && scoreLimite === 2 && 'bg-attention',
              index < scoreLimite && scoreLimite === 3 && 'bg-lien',
              index < scoreLimite && scoreLimite >= 4 && 'bg-succes'
            )}
          />
        ))}
      </div>
      <p className='text-xs text-muted-foreground'>
        Force : {LIBELLES_FORCE[scoreLimite]}
      </p>
    </div>
  )
}

/** Page profil organisateur (informations et mot de passe). */
export function PageProfilOrganisateur() {
  const utilisateur = useAuthentification((etat) => etat.utilisateur)
  const definirUtilisateur = useAuthentification(
    (etat) => etat.definirUtilisateur
  )
  const { estMobile } = useEcran()
  const [dialogueDeconnexion, definirDialogueDeconnexion] = useDialogState()
  const [sauvegardeProfil, definirSauvegardeProfil] = useState(false)
  const [changementMotDePasse, definirChangementMotDePasse] = useState(false)

  const formulaireProfil = useForm<DonneesProfil>({
    resolver: zodResolver(schemaProfil),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
    },
  })

  const formulaireMotDePasse = useForm<DonneesMotDePasse>({
    resolver: zodResolver(schemaMotDePasse),
    defaultValues: {
      ancien_mot_de_passe: '',
      nouveau_mot_de_passe: '',
      confirmation_mot_de_passe: '',
    },
  })

  const nouveauMotDePasse = useWatch({
    control: formulaireMotDePasse.control,
    name: 'nouveau_mot_de_passe',
  })
  const scoreForce = evaluerForceMotDePasse(nouveauMotDePasse ?? '')

  useEffect(() => {
    if (utilisateur) {
      formulaireProfil.reset({
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
      })
    }
  }, [utilisateur, formulaireProfil])

  // Met à jour les informations personnelles de l'organisateur.
  const soumettreProfil = async (donnees: DonneesProfil) => {
    if (!utilisateur) return
    definirSauvegardeProfil(true)
    try {
      const misAJour = await mettreAJourProfil(utilisateur.id_utilisateur, {
        nom: donnees.nom,
        prenom: donnees.prenom,
        email: donnees.email,
        telephone: donnees.telephone,
      })
      definirUtilisateur({
        id_utilisateur: misAJour.id_utilisateur,
        nom: misAJour.nom,
        prenom: misAJour.prenom,
        email: misAJour.email,
        telephone: misAJour.telephone,
        role_systeme: misAJour.role_systeme,
        actif: misAJour.actif,
        date_creation: misAJour.date_creation,
      })
      await afficherSucces(
        'Profil mis à jour',
        'Vos informations personnelles ont été enregistrées.'
      )
    } catch (erreur) {
      const message =
        erreur instanceof Error
          ? erreur.message
          : 'Impossible de mettre à jour le profil.'
      await afficherErreur('Mise à jour impossible', message)
    } finally {
      definirSauvegardeProfil(false)
    }
  }

  // Change le mot de passe après validation et confirmation.
  const soumettreMotDePasse = async (donnees: DonneesMotDePasse) => {
    if (!utilisateur) return

    const ok = await demanderConfirmation({
      titre: 'Changer le mot de passe ?',
      texte: 'Votre mot de passe de connexion sera remplacé. Confirmez-vous cette action ?',
      boutonConfirmer: 'Changer le mot de passe',
      boutonAnnuler: 'Annuler',
      icone: 'question',
    })
    if (!ok) return

    definirChangementMotDePasse(true)
    try {
      await changerMotDePasse(
        utilisateur.id_utilisateur,
        donnees.ancien_mot_de_passe,
        donnees.nouveau_mot_de_passe
      )
      formulaireMotDePasse.reset()
      await afficherSucces(
        'Mot de passe modifié',
        'Utilisez votre nouveau mot de passe lors de la prochaine connexion.'
      )
    } catch (erreur) {
      const message =
        erreur instanceof Error
          ? erreur.message
          : 'Impossible de changer le mot de passe.'
      await afficherErreur('Changement impossible', message)
    } finally {
      definirChangementMotDePasse(false)
    }
  }

  return (
    <>
      <EnTeteOrganisateur
        titre='Profil'
        actions={
          <>
            {!estMobile ? (
              <>
                <Button
                  type='button'
                  variant='outline'
                  className='min-h-11 border-destructive/40 text-destructive hover:bg-destructive/10'
                  onClick={() => definirDialogueDeconnexion(true)}
                >
                  <LogOut className='size-4' />
                  <span className='hidden sm:inline'>Se déconnecter</span>
                </Button>
                <ThemeSwitch />
                <ProfileDropdown />
              </>
            ) : (
              <Button
                type='button'
                variant='outline'
                size='icon'
                className='size-11 border-destructive/40 text-destructive'
                onClick={() => definirDialogueDeconnexion(true)}
                aria-label='Se déconnecter'
              >
                <LogOut className='size-4' />
              </Button>
            )}
          </>
        }
      />
      <div className='mx-auto max-w-3xl space-y-6 px-4 py-4 sm:px-6'>
        <Card className='shadow-xs'>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              Modifiez votre nom, e-mail et téléphone affichés sur la plateforme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...formulaireProfil}>
              <form
                onSubmit={formulaireProfil.handleSubmit(soumettreProfil)}
                className='space-y-4'
              >
                <div className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={formulaireProfil.control}
                    name='prenom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input className='min-h-11' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formulaireProfil.control}
                    name='nom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input className='min-h-11' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={formulaireProfil.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          autoComplete='email'
                          className='min-h-11'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formulaireProfil.control}
                  name='telephone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          type='tel'
                          autoComplete='tel'
                          className='min-h-11'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex justify-end pt-2'>
                  <Button
                    type='submit'
                    className='min-h-11 hover:bg-principal-hover'
                    disabled={sauvegardeProfil || !utilisateur}
                  >
                    {sauvegardeProfil ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <Save />
                    )}
                    Enregistrer le profil
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className='shadow-xs'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='size-5 text-primary' aria-hidden />
              Mot de passe
            </CardTitle>
            <CardDescription>
              Utilisez un mot de passe fort et unique pour sécuriser votre accès.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...formulaireMotDePasse}>
              <form
                onSubmit={formulaireMotDePasse.handleSubmit(soumettreMotDePasse)}
                className='space-y-4'
              >
                <FormField
                  control={formulaireMotDePasse.control}
                  name='ancien_mot_de_passe'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ancien mot de passe</FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete='current-password'
                          className='min-h-11'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Separator />
                <FormField
                  control={formulaireMotDePasse.control}
                  name='nouveau_mot_de_passe'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete='new-password'
                          className='min-h-11'
                          {...field}
                        />
                      </FormControl>
                      <IndicateurForceMotDePasse score={scoreForce} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formulaireMotDePasse.control}
                  name='confirmation_mot_de_passe'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation</FormLabel>
                      <FormControl>
                        <PasswordInput
                          autoComplete='new-password'
                          className='min-h-11'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex justify-end pt-2'>
                  <Button
                    type='submit'
                    variant='secondary'
                    className='min-h-11'
                    disabled={changementMotDePasse || !utilisateur}
                  >
                    {changementMotDePasse ? (
                      <Loader2 className='animate-spin' />
                    ) : (
                      <Shield />
                    )}
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <SignOutDialog
        open={!!dialogueDeconnexion}
        onOpenChange={definirDialogueDeconnexion}
      />
    </>
  )
}
