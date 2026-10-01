import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import JSZip from 'jszip'
import {
  Archive,
  FileDown,
  Loader2,
  Mail,
} from 'lucide-react'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import { obtenirModeleInvitation } from '@/services/modeles-invitation'
import {
  listerInvitations,
  type InvitationEnrichie,
} from '@/services/invitations'
import {
  chargerOctetsPdfModele,
  genererPdfInvitationUnique,
  genererPdfMultipage,
  octetsVersBlob,
  telechargerBlob,
} from '@/lib/invitations-pdf'
import { afficherErreur, afficherSucces } from '@/lib/alertes'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import { GardeEvenementActif } from '@/features/organisateur/composants/bandeau-evenement-actif'
import { EtatErreur } from '@/components/etat-erreur'
import { EtatVide } from '@/components/etat-vide'
import { SquelettePage } from '@/components/squelette-page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEcran } from '@/hooks/use-ecran'
import { cn } from '@/lib/utils'

/** Convertit une invitation enrichie en données PDF. */
function invitationVersPdf(invitation: InvitationEnrichie) {
  return {
    libelle_noms: invitation.libelle_noms,
    code_qr: invitation.code_qr,
  }
}

/** Nom de fichier sûr à partir du libellé des noms. */
function nomFichierInvitation(libelle: string): string {
  return libelle.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '').slice(0, 80)
}

/** Page génération des invitations PDF personnalisées. */
export function PageGenerationInvitations() {
  const { evenementActif } = useEvenementActif()
  const { estMobile } = useEcran()
  const idEvenement = evenementActif?.id_evenement ?? ''

  const [recherche, definirRecherche] = useState('')
  const [selection, definirSelection] = useState<Set<string>>(new Set())
  const [enCours, definirEnCours] = useState(false)
  const [progression, definirProgression] = useState({ fait: 0, total: 0 })

  const requeteModele = useQuery({
    queryKey: ['modele-invitation', idEvenement],
    queryFn: () => obtenirModeleInvitation(idEvenement),
    enabled: Boolean(idEvenement),
  })

  const requeteInvitations = useQuery({
    queryKey: ['invitations', idEvenement],
    queryFn: () => listerInvitations(idEvenement),
    enabled: Boolean(idEvenement),
  })

  const invitationsFiltrees = useMemo(() => {
    const liste = requeteInvitations.data ?? []
    const terme = recherche.trim().toLowerCase()
    if (!terme) return liste
    return liste.filter(
      (inv) =>
        inv.libelle_noms.toLowerCase().includes(terme) ||
        inv.code_qr.toLowerCase().includes(terme)
    )
  }, [requeteInvitations.data, recherche])

  const invitationsSelectionnees = useMemo(
    () =>
      (requeteInvitations.data ?? []).filter((inv) =>
        selection.has(inv.id_invitation)
      ),
    [requeteInvitations.data, selection]
  )

  /** Bascule la sélection d'une invitation. */
  const basculerInvitation = (
    invitation: InvitationEnrichie,
    coche: boolean
  ) => {
    definirSelection((prev) => {
      const suivant = new Set(prev)
      if (coche) suivant.add(invitation.id_invitation)
      else suivant.delete(invitation.id_invitation)
      return suivant
    })
  }

  /** Sélectionne ou désélectionne toutes les invitations filtrées. */
  const basculerTous = (coche: boolean) => {
    if (coche) {
      definirSelection(
        new Set(invitationsFiltrees.map((i) => i.id_invitation))
      )
    } else {
      definirSelection(new Set())
    }
  }

  /** Génère et télécharge un PDF multipage. */
  const telechargerMultipage = async () => {
    const modele = requeteModele.data
    if (!modele || invitationsSelectionnees.length === 0) return
    definirEnCours(true)
    definirProgression({ fait: 0, total: invitationsSelectionnees.length })
    try {
      const octetsModele = await chargerOctetsPdfModele(modele)
      const donnees = invitationsSelectionnees.map(invitationVersPdf)
      const pdf = await genererPdfMultipage(
        octetsModele,
        modele,
        donnees,
        (fait, total) => definirProgression({ fait, total })
      )
      const blob = octetsVersBlob(pdf, 'application/pdf')
      const nom =
        evenementActif?.nom_evenement.replace(/\s+/g, '_') ?? 'invitations'
      telechargerBlob(blob, `${nom}_invitations.pdf`)
      await afficherSucces(
        'PDF généré',
        `${invitationsSelectionnees.length} invitation(s) dans un seul fichier.`
      )
    } catch (erreur) {
      const message =
        erreur instanceof Error ? erreur.message : 'Génération impossible.'
      await afficherErreur('Génération impossible', message)
    } finally {
      definirEnCours(false)
      definirProgression({ fait: 0, total: 0 })
    }
  }

  /** Génère un ZIP avec un PDF par invitation. */
  const telechargerZip = async () => {
    const modele = requeteModele.data
    if (!modele || invitationsSelectionnees.length === 0) return
    definirEnCours(true)
    definirProgression({ fait: 0, total: invitationsSelectionnees.length })
    try {
      const octetsModele = await chargerOctetsPdfModele(modele)
      const zip = new JSZip()
      for (let i = 0; i < invitationsSelectionnees.length; i += 1) {
        const invitation = invitationsSelectionnees[i]
        const pdf = await genererPdfInvitationUnique(
          octetsModele,
          modele,
          invitationVersPdf(invitation)
        )
        const nomFichier = `${nomFichierInvitation(invitation.libelle_noms)}.pdf`
        zip.file(nomFichier, pdf)
        definirProgression({ fait: i + 1, total: invitationsSelectionnees.length })
      }
      const contenu = await zip.generateAsync({ type: 'blob' })
      const nom =
        evenementActif?.nom_evenement.replace(/\s+/g, '_') ?? 'invitations'
      telechargerBlob(contenu, `${nom}_invitations.zip`)
      await afficherSucces(
        'ZIP généré',
        `${invitationsSelectionnees.length} fichier(s) PDF dans l’archive.`
      )
    } catch (erreur) {
      const message =
        erreur instanceof Error ? erreur.message : 'Génération impossible.'
      await afficherErreur('Génération impossible', message)
    } finally {
      definirEnCours(false)
      definirProgression({ fait: 0, total: 0 })
    }
  }

  const chargement =
    requeteModele.isLoading || requeteInvitations.isLoading
  const erreur = requeteModele.isError || requeteInvitations.isError
  const sansModele =
    !chargement && !erreur && requeteModele.data === null

  const pourcentage =
    progression.total > 0
      ? Math.round((progression.fait / progression.total) * 100)
      : 0

  return (
    <GardeEvenementActif>
      <EnTeteOrganisateur
        titre='Export PDF des invitations'
        actions={
          !estMobile ? (
            <>
              <ThemeSwitch />
              <ProfileDropdown />
            </>
          ) : null
        }
      />
      <div className='flex flex-col gap-4 px-4 py-4 sm:px-6'>
        {chargement ? <SquelettePage /> : null}
        {erreur ? (
          <EtatErreur
            message='Impossible de charger les données'
            onReessayer={() => {
              void requeteModele.refetch()
              void requeteInvitations.refetch()
            }}
          />
        ) : null}

        {sansModele ? (
          <EtatVide
            titre='Aucun modèle d’invitation'
            description='Configurez d’abord le PDF modèle et les zones nom / QR.'
            action={
              <Button asChild className='min-h-11'>
                <Link to='/organisateur/invitation'>
                  <Mail className='size-4' />
                  Configurer le modèle
                </Link>
              </Button>
            }
          />
        ) : null}

        {!sansModele && !chargement && !erreur ? (
          <>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <Input
                placeholder='Rechercher une invitation…'
                value={recherche}
                onChange={(e) => definirRecherche(e.target.value)}
                className='min-h-11 max-w-md'
              />
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  className='min-h-11'
                  disabled={enCours}
                  onClick={() => basculerTous(true)}
                >
                  Tout sélectionner
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  className='min-h-11'
                  disabled={enCours}
                  onClick={() => basculerTous(false)}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>

            {(requeteInvitations.data ?? []).length === 0 ? (
              <EtatVide
                titre='Aucune invitation à exporter'
                description='Commencez par créer des invitations : Tables → choisir une table → sélectionner les invités sans QR → créer l’invitation. Revenez ensuite ici pour télécharger les PDF.'
                action={
                  <Button asChild variant='secondary' className='min-h-11'>
                    <Link to='/organisateur/invitations'>
                      Créer des invitations
                    </Link>
                  </Button>
                }
              />
            ) : invitationsFiltrees.length === 0 ? (
              <EtatVide
                titre='Aucun résultat'
                description='Aucune invitation ne correspond à votre recherche.'
              />
            ) : (
              <ul className='flex flex-col gap-2'>
                {invitationsFiltrees.map((invitation) => (
                  <li
                    key={invitation.id_invitation}
                    className='flex min-h-11 items-center gap-3 rounded-lg border border-border bg-card px-3 py-2'
                  >
                    <Checkbox
                      id={`sel-${invitation.id_invitation}`}
                      checked={selection.has(invitation.id_invitation)}
                      onCheckedChange={(val) =>
                        basculerInvitation(invitation, val === true)
                      }
                    />
                    <Label
                      htmlFor={`sel-${invitation.id_invitation}`}
                      className='flex flex-1 cursor-pointer flex-col sm:flex-row sm:items-center sm:justify-between'
                    >
                      <span className='font-medium'>
                        {invitation.libelle_noms}
                      </span>
                      <span className='font-mono text-xs text-muted-foreground'>
                        {invitation.code_qr}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            )}

            {enCours && progression.total > 0 ? (
              <div className='space-y-2 rounded-xl border border-border bg-card p-4'>
                <div className='flex justify-between text-sm text-muted-foreground'>
                  <span>Génération en cours…</span>
                  <span>
                    {progression.fait} / {progression.total} ({pourcentage} %)
                  </span>
                </div>
                <div
                  className='h-2 overflow-hidden rounded-full bg-muted'
                  role='progressbar'
                  aria-valuenow={pourcentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={cn(
                      'h-full rounded-full bg-primary transition-all duration-200'
                    )}
                    style={{ width: `${pourcentage}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className='flex flex-wrap gap-3 border-t border-border pt-4'>
              <Button
                type='button'
                className='min-h-11 hover:bg-principal-hover'
                disabled={
                  enCours ||
                  invitationsSelectionnees.length === 0 ||
                  !requeteModele.data
                }
                onClick={() => void telechargerMultipage()}
              >
                {enCours ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <FileDown className='size-4' />
                )}
                PDF multipage ({invitationsSelectionnees.length})
              </Button>
              <Button
                type='button'
                variant='secondary'
                className='min-h-11'
                disabled={
                  enCours ||
                  invitationsSelectionnees.length === 0 ||
                  !requeteModele.data
                }
                onClick={() => void telechargerZip()}
              >
                {enCours ? (
                  <Loader2 className='size-4 animate-spin' />
                ) : (
                  <Archive className='size-4' />
                )}
                ZIP (un PDF par invitation)
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Les PDF générés ne sont pas enregistrés sur la plateforme : ils
              sont téléchargés directement sur votre appareil.
            </p>
          </>
        ) : null}
      </div>
    </GardeEvenementActif>
  )
}
