import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Save } from 'lucide-react'
import {
  afficherErreur,
  afficherSucces,
} from '@/lib/alertes'
import {
  enregistrerParametres,
  obtenirParametres,
} from '@/services/parametres'
import type { ParametresPlateforme } from '@/types'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FUSEAUX_HORAIRES = [
  { valeur: 'Africa/Kinshasa', libelle: 'Kinshasa (UTC+1)' },
  { valeur: 'Africa/Lagos', libelle: 'Lagos (UTC+1)' },
  { valeur: 'Africa/Cairo', libelle: 'Le Caire (UTC+2)' },
  { valeur: 'Europe/Paris', libelle: 'Paris (UTC+1 / +2)' },
  { valeur: 'Europe/London', libelle: 'Londres (UTC+0 / +1)' },
] as const

const LANGUES = [
  { valeur: 'fr', libelle: 'Français' },
  { valeur: 'en', libelle: 'Anglais' },
] as const

const schemaParametres = z.object({
  nom_plateforme: z
    .string()
    .min(1, 'Le nom de la plateforme est obligatoire.'),
  description: z.string().min(1, 'La description est obligatoire.'),
  email_contact: z.email({ error: 'Adresse e-mail de contact invalide.' }),
  telephone_contact: z
    .string()
    .min(1, 'Le numéro de téléphone est obligatoire.'),
  longueur_minimale_mot_de_passe: z
    .number()
    .min(6, 'La longueur minimale est de 6 caractères.')
    .max(32, 'La longueur maximale est de 32 caractères.'),
  duree_session_minutes: z
    .number()
    .min(15, 'La session doit durer au moins 15 minutes.')
    .max(1440, 'La session ne peut pas dépasser 24 heures (1440 min).'),
  fuseau_horaire: z.string().min(1, 'Choisissez un fuseau horaire.'),
  langue_par_defaut: z.string().min(1, 'Choisissez une langue.'),
})

type DonneesParametres = z.infer<typeof schemaParametres>

const valeursParDefaut: DonneesParametres = {
  nom_plateforme: '',
  description: '',
  email_contact: '',
  telephone_contact: '',
  longueur_minimale_mot_de_passe: 8,
  duree_session_minutes: 480,
  fuseau_horaire: 'Africa/Kinshasa',
  langue_par_defaut: 'fr',
}

// Page de configuration globale de la plateforme EventQR.
export function Parametres() {
  const [enregistrement, definirEnregistrement] = useState(false)

  const requete = useQuery({
    queryKey: ['parametres-plateforme'],
    queryFn: obtenirParametres,
  })

  const formulaire = useForm<DonneesParametres>({
    resolver: zodResolver(schemaParametres),
    defaultValues: valeursParDefaut,
  })

  useEffect(() => {
    if (requete.data) {
      formulaire.reset(requete.data)
    }
  }, [requete.data, formulaire])

  // Enregistre les paramètres modifiés et affiche une confirmation.
  const soumettre = async (donnees: DonneesParametres) => {
    definirEnregistrement(true)
    try {
      const parametres: ParametresPlateforme = { ...donnees }
      await enregistrerParametres(parametres)
      await afficherSucces(
        'Paramètres enregistrés',
        'La configuration de la plateforme a été mise à jour.'
      )
    } catch (erreur) {
      const message =
        erreur instanceof Error
          ? erreur.message
          : 'Impossible d’enregistrer les paramètres.'
      await afficherErreur('Enregistrement impossible', message)
    } finally {
      definirEnregistrement(false)
    }
  }

  const enChargement = requete.isLoading
  const enErreur = requete.isError

  return (
    <>
      <Header titre='Paramètres'>
        <ThemeSwitch />
        <ProfileDropdown />
      </Header>
      <Main>
        {enChargement ? <SquelettePage lignes={6} /> : null}
        {enErreur ? (
          <EtatErreur
            message='Impossible de charger les paramètres.'
            onReessayer={() => void requete.refetch()}
          />
        ) : null}

        {!enChargement && !enErreur ? (
          <Form {...formulaire}>
            <form
              onSubmit={formulaire.handleSubmit(soumettre)}
              className='mx-auto max-w-3xl space-y-6'
            >
              <Card className='shadow-xs'>
                <CardHeader>
                  <CardTitle>Général</CardTitle>
                  <CardDescription>
                    Nom public, description et coordonnées de contact.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <FormField
                    control={formulaire.control}
                    name='nom_plateforme'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de la plateforme</FormLabel>
                        <FormControl>
                          <Input className='min-h-11' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formulaire.control}
                    name='description'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            className='min-h-24 resize-y'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <FormField
                      control={formulaire.control}
                      name='email_contact'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail de contact</FormLabel>
                          <FormControl>
                            <Input
                              type='email'
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
                      name='telephone_contact'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone de contact</FormLabel>
                          <FormControl>
                            <Input
                              type='tel'
                              className='min-h-11'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-xs'>
                <CardHeader>
                  <CardTitle>Sécurité</CardTitle>
                  <CardDescription>
                    Règles de mot de passe et durée des sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={formulaire.control}
                    name='longueur_minimale_mot_de_passe'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longueur minimale du mot de passe</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={6}
                            max={32}
                            className='min-h-11'
                            {...field}
                            onChange={(event) =>
                              field.onChange(event.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={formulaire.control}
                    name='duree_session_minutes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée de session (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min={15}
                            max={1440}
                            className='min-h-11'
                            {...field}
                            onChange={(event) =>
                              field.onChange(event.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className='shadow-xs'>
                <CardHeader>
                  <CardTitle>Configuration</CardTitle>
                  <CardDescription>
                    Fuseau horaire et langue par défaut de l’interface.
                  </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 sm:grid-cols-2'>
                  <FormField
                    control={formulaire.control}
                    name='fuseau_horaire'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuseau horaire</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='min-h-11 w-full'>
                              <SelectValue placeholder='Choisir un fuseau' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FUSEAUX_HORAIRES.map((fuseau) => (
                              <SelectItem
                                key={fuseau.valeur}
                                value={fuseau.valeur}
                              >
                                {fuseau.libelle}
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
                    name='langue_par_defaut'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Langue par défaut</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className='min-h-11 w-full'>
                              <SelectValue placeholder='Choisir une langue' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LANGUES.map((langue) => (
                              <SelectItem
                                key={langue.valeur}
                                value={langue.valeur}
                              >
                                {langue.libelle}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='min-h-11 hover:bg-principal-hover'
                  disabled={enregistrement}
                >
                  {enregistrement ? (
                    <Loader2 className='animate-spin' />
                  ) : (
                    <Save />
                  )}
                  Enregistrer
                </Button>
              </div>
            </form>
          </Form>
        ) : null}
      </Main>
    </>
  )
}
