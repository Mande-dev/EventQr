import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { afficherErreur, afficherSucces } from '@/lib/alertes'
import { creerUtilisateur } from '@/services/utilisateurs'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { PasswordInput } from '@/components/password-input'

const schemaCreationOrganisateur = z
  .object({
    nom: z.string().min(1, 'Le nom est obligatoire.'),
    prenom: z.string().min(1, 'Le prénom est obligatoire.'),
    email: z.email({ error: 'Adresse e-mail invalide.' }),
    telephone: z.string().min(1, 'Le téléphone est obligatoire.'),
    actif: z.boolean(),
    mot_de_passe: z
      .string()
      .min(1, 'Le mot de passe est obligatoire.')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    confirmation_mot_de_passe: z.string().min(1, 'Confirmez le mot de passe.'),
  })
  .refine(
    (donnees) => donnees.mot_de_passe === donnees.confirmation_mot_de_passe,
    {
      message: 'Les mots de passe ne correspondent pas.',
      path: ['confirmation_mot_de_passe'],
    }
  )

type DonneesCreationOrganisateurFormulaire = z.infer<
  typeof schemaCreationOrganisateur
>

type ProprietesFormulaireUtilisateur = {
  ouvert: boolean
  onOuvertChange: (ouvert: boolean) => void
}

// Valeurs initiales du formulaire de création d'organisateur.
const valeursParDefaut = (): DonneesCreationOrganisateurFormulaire => ({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  actif: true,
  mot_de_passe: '',
  confirmation_mot_de_passe: '',
})

// Dialog / tiroir de création d'un organisateur uniquement.
export function FormulaireUtilisateur({
  ouvert,
  onOuvertChange,
}: ProprietesFormulaireUtilisateur) {
  const estMobile = useIsMobile()
  const clientRequetes = useQueryClient()

  const formulaire = useForm<DonneesCreationOrganisateurFormulaire>({
    resolver: zodResolver(schemaCreationOrganisateur),
    defaultValues: valeursParDefaut(),
  })

  useEffect(() => {
    if (ouvert) {
      formulaire.reset(valeursParDefaut())
    }
  }, [ouvert, formulaire])

  const mutation = useMutation({
    mutationFn: async (donnees: DonneesCreationOrganisateurFormulaire) =>
      creerUtilisateur({
        nom: donnees.nom,
        prenom: donnees.prenom,
        email: donnees.email,
        telephone: donnees.telephone,
        mot_de_passe: donnees.mot_de_passe,
        actif: donnees.actif,
      }),
    onSuccess: async () => {
      void clientRequetes.invalidateQueries({ queryKey: ['utilisateurs'] })
      await afficherSucces(
        'Organisateur créé',
        'Le compte organisateur a été ajouté avec succès.'
      )
      onOuvertChange(false)
      formulaire.reset(valeursParDefaut())
    },
    onError: async (erreur: unknown) => {
      const message =
        erreur instanceof Error
          ? erreur.message
          : 'Impossible de créer l’organisateur.'
      await afficherErreur('Création impossible', message)
    },
  })

  // Envoie les données validées au service de création.
  const soumettre = (donnees: DonneesCreationOrganisateurFormulaire) => {
    mutation.mutate(donnees)
  }

  const champsFormulaire = (
    <Form {...formulaire}>
      <form
        id='formulaire-organisateur'
        onSubmit={formulaire.handleSubmit(soumettre)}
        className='grid gap-4'
      >
        <div className='rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
          Rôle attribué : <span className='font-medium text-foreground'>Organisateur</span>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={formulaire.control}
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
            control={formulaire.control}
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
          control={formulaire.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type='email' className='min-h-11' {...field} />
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
                <Input type='tel' className='min-h-11' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={formulaire.control}
          name='actif'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border border-border p-4'>
              <div className='space-y-0.5'>
                <FormLabel>Compte actif</FormLabel>
                <FormDescription>
                  Un compte inactif ne peut pas se connecter.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
                  autoComplete='new-password'
                  placeholder='********'
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
          name='confirmation_mot_de_passe'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmation du mot de passe</FormLabel>
              <FormControl>
                <PasswordInput
                  autoComplete='new-password'
                  placeholder='********'
                  className='min-h-11'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const piedActions = (
    <>
      <Button
        type='button'
        variant='outline'
        className='min-h-11'
        onClick={() => onOuvertChange(false)}
        disabled={mutation.isPending}
      >
        Annuler
      </Button>
      <Button
        type='submit'
        form='formulaire-organisateur'
        className='min-h-11 hover:bg-principal-hover'
        disabled={mutation.isPending}
      >
        {mutation.isPending ? <Loader2 className='animate-spin' /> : 'Créer'}
      </Button>
    </>
  )

  if (estMobile) {
    return (
      <Sheet open={ouvert} onOpenChange={onOuvertChange}>
        <SheetContent side='bottom' className='flex max-h-[92vh] flex-col gap-4'>
          <SheetHeader className='text-start'>
            <SheetTitle>Nouvel organisateur</SheetTitle>
            <SheetDescription>
              Créez un compte organisateur EventQR.
            </SheetDescription>
          </SheetHeader>
          <div className='flex-1 overflow-y-auto pe-1'>{champsFormulaire}</div>
          <SheetFooter className='flex-row gap-2 sm:justify-end'>
            {piedActions}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Nouvel organisateur</DialogTitle>
          <DialogDescription>
            Créez un compte organisateur EventQR.
          </DialogDescription>
        </DialogHeader>
        {champsFormulaire}
        <DialogFooter className='gap-2 sm:gap-0'>{piedActions}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
