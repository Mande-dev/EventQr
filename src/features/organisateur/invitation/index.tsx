import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Document, Page, pdfjs } from 'react-pdf'
import { Rnd } from 'react-rnd'
import {
  Eye,
  Loader2,
  Minus,
  Plus,
  Save,
  Upload,
} from 'lucide-react'
import { useEvenementActif } from '@/context/evenement-actif-provider'
import {
  enregistrerModeleInvitation,
  obtenirModeleInvitation,
} from '@/services/modeles-invitation'
import {
  dataUrlVersOctets,
  genererPdfInviteUnique,
  octetsVersBlob,
  pdfVersEcran,
  zonesParDefaut,
} from '@/lib/invitations-pdf'
import {
  afficherErreur,
  afficherSucces,
  apresFermetureOverlay,
} from '@/lib/alertes'
import { EnTeteOrganisateur } from '@/features/organisateur/composants/en-tete-organisateur'
import {
  GardeEvenementActif,
} from '@/features/organisateur/composants/bandeau-evenement-actif'
import { FeuilleModale } from '@/components/feuille-modale'
import { EtatErreur } from '@/components/etat-erreur'
import { SquelettePage } from '@/components/squelette-page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useEcran } from '@/hooks/use-ecran'
import { cn } from '@/lib/utils'
import type { DonneesPageInvitationPdf } from '@/lib/invitations-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

type ZonesEtat = {
  zone_nom_x: number
  zone_nom_y: number
  zone_nom_largeur: number
  zone_nom_hauteur: number
  zone_qr_x: number
  zone_qr_y: number
  zone_qr_largeur: number
  zone_qr_hauteur: number
}

const APERCU_INVITATION: DonneesPageInvitationPdf = {
  libelle_noms: 'Jean Dupont',
  code_qr: 'EVENTQR-APERCU-DEMO',
}

/** Lit un fichier PDF et renvoie une data URL. */
function lireFichierPdf(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => {
      if (typeof lecteur.result === 'string') resolve(lecteur.result)
      else reject(new Error('Lecture du PDF impossible.'))
    }
    lecteur.onerror = () => reject(new Error('Lecture du PDF impossible.'))
    lecteur.readAsDataURL(fichier)
  })
}

type ProprietesZoneRnd = {
  libelle: string
  couleurBordure: string
  rect: { x: number; y: number; width: number; height: number }
  onChange: (rect: { x: number; y: number; width: number; height: number }) => void
}

/** Zone redimensionnable superposée au PDF. */
function ZoneRnd({
  libelle,
  couleurBordure,
  rect,
  onChange,
}: ProprietesZoneRnd) {
  return (
    <Rnd
      bounds='parent'
      size={{ width: rect.width, height: rect.height }}
      position={{ x: rect.x, y: rect.y }}
      onDragStop={(_e, data) => {
        onChange({
          x: data.x,
          y: data.y,
          width: rect.width,
          height: rect.height,
        })
      }}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        onChange({
          x: position.x,
          y: position.y,
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        })
      }}
      className={cn(
        'border-2 border-dashed bg-primary/10 backdrop-blur-[1px]',
        couleurBordure
      )}
    >
      <span className='pointer-events-none absolute -top-6 left-0 rounded-md bg-card px-2 py-0.5 text-xs font-medium text-foreground shadow-sm'>
        {libelle}
      </span>
    </Rnd>
  )
}

/** Page modèle d'invitation PDF (zones nom et QR). */
export function PageInvitationModele() {
  const { evenementActif } = useEvenementActif()
  const { estMobile } = useEcran()
  const queryClient = useQueryClient()
  const entreeFichier = useRef<HTMLInputElement>(null)

  const [fichierPdf, definirFichierPdf] = useState<string | null>(null)
  const [zones, definirZones] = useState<ZonesEtat | null>(null)
  const [largeurPage, definirLargeurPage] = useState(595)
  const [hauteurPage, definirHauteurPage] = useState(842)
  const [zoom, definirZoom] = useState(1)
  const [apercuOuvert, definirApercuOuvert] = useState(false)
  const [urlApercu, definirUrlApercu] = useState<string | null>(null)
  const [generationApercu, definirGenerationApercu] = useState(false)

  const idEvenement = evenementActif?.id_evenement ?? ''

  const requeteModele = useQuery({
    queryKey: ['modele-invitation', idEvenement],
    queryFn: () => obtenirModeleInvitation(idEvenement),
    enabled: Boolean(idEvenement),
  })

  // Initialise le PDF et les zones depuis le modèle chargé.
  useEffect(() => {
    if (!requeteModele.data) return
    const modele = requeteModele.data
    if (modele.fichier_pdf && !modele.fichier_pdf.startsWith('/modeles/')) {
      definirFichierPdf(modele.fichier_pdf)
    }
    definirZones({
      zone_nom_x: modele.zone_nom_x,
      zone_nom_y: modele.zone_nom_y,
      zone_nom_largeur: modele.zone_nom_largeur,
      zone_nom_hauteur: modele.zone_nom_hauteur,
      zone_qr_x: modele.zone_qr_x,
      zone_qr_y: modele.zone_qr_y,
      zone_qr_largeur: modele.zone_qr_largeur,
      zone_qr_hauteur: modele.zone_qr_hauteur,
    })
  }, [requeteModele.data])

  const echelle = useMemo(() => {
    const base = estMobile ? 280 : 480
    return (base / largeurPage) * zoom
  }, [estMobile, largeurPage, zoom])

  const largeurAffichee = largeurPage * echelle
  const hauteurAffichee = hauteurPage * echelle

  const rectNom = useMemo(() => {
    if (!zones) return null
    return pdfVersEcran(
      {
        x: zones.zone_nom_x,
        y: zones.zone_nom_y,
        largeur: zones.zone_nom_largeur,
        hauteur: zones.zone_nom_hauteur,
      },
      hauteurPage,
      echelle
    )
  }, [zones, hauteurPage, echelle])

  const rectQr = useMemo(() => {
    if (!zones) return null
    return pdfVersEcran(
      {
        x: zones.zone_qr_x,
        y: zones.zone_qr_y,
        largeur: zones.zone_qr_largeur,
        hauteur: zones.zone_qr_hauteur,
      },
      hauteurPage,
      echelle
    )
  }, [zones, hauteurPage, echelle])

  // Met à jour les zones nom depuis le drag Rnd.
  const mettreAJourZoneNom = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      definirZones((prev) => {
        if (!prev) return prev
        const yPdf =
          hauteurPage - rect.y / echelle - rect.height / echelle
        return {
          ...prev,
          zone_nom_x: rect.x / echelle,
          zone_nom_y: yPdf,
          zone_nom_largeur: rect.width / echelle,
          zone_nom_hauteur: rect.height / echelle,
        }
      })
    },
    [echelle, hauteurPage]
  )

  // Met à jour les zones QR depuis le drag Rnd.
  const mettreAJourZoneQr = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      definirZones((prev) => {
        if (!prev) return prev
        const yPdf =
          hauteurPage - rect.y / echelle - rect.height / echelle
        return {
          ...prev,
          zone_qr_x: rect.x / echelle,
          zone_qr_y: yPdf,
          zone_qr_largeur: rect.width / echelle,
          zone_qr_hauteur: rect.height / echelle,
        }
      })
    },
    [echelle, hauteurPage]
  )

  // Charge les dimensions de la première page PDF.
  const onPageChargee = useCallback(
    (page: { originalWidth: number; originalHeight: number }) => {
      definirLargeurPage(page.originalWidth)
      definirHauteurPage(page.originalHeight)
      definirZones((prev) => {
        if (prev) return prev
        return zonesParDefaut(page.originalWidth, page.originalHeight)
      })
    },
    []
  )

  // Importe un PDF depuis le disque.
  const importerPdf = async (fichier: File | undefined) => {
    if (!fichier || fichier.type !== 'application/pdf') {
      await afficherErreur('Import impossible', 'Sélectionnez un fichier PDF.')
      return
    }
    try {
      const dataUrl = await lireFichierPdf(fichier)
      definirFichierPdf(dataUrl)
      definirZones(null)
    } catch (erreur) {
      const message =
        erreur instanceof Error ? erreur.message : 'Import du PDF échoué.'
      await afficherErreur('Import impossible', message)
    }
  }

  const mutationSauvegarde = useMutation({
    mutationFn: async () => {
      if (!fichierPdf || !zones || !idEvenement) {
        throw new Error('Importez un PDF et positionnez les zones.')
      }
      return enregistrerModeleInvitation(idEvenement, {
        fichier_pdf: fichierPdf,
        ...zones,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['modele-invitation', idEvenement],
      })
      await apresFermetureOverlay(() => {
        definirApercuOuvert(false)
      }, async () => {
        await afficherSucces(
          'Modèle enregistré',
          'Les zones nom et QR sont sauvegardées pour cet événement.'
        )
      })
    },
    onError: async (erreur) => {
      const message =
        erreur instanceof Error ? erreur.message : 'Enregistrement impossible.'
      await apresFermetureOverlay(() => {
        definirApercuOuvert(false)
      }, async () => {
        await afficherErreur('Enregistrement impossible', message)
      })
    },
  })

  // Génère un PDF d'aperçu avec invité fictif.
  const ouvrirApercu = async () => {
    if (!fichierPdf || !zones) {
      await afficherErreur(
        'Aperçu indisponible',
        'Importez un PDF et définissez les zones.'
      )
      return
    }
    definirGenerationApercu(true)
    try {
      const octets = dataUrlVersOctets(fichierPdf)
      const modele = {
        id_modele: 'apercu',
        id_evenement: idEvenement,
        fichier_pdf: fichierPdf,
        date_creation: new Date().toISOString(),
        ...zones,
      }
      const pdfGenere = await genererPdfInviteUnique(
        octets,
        modele,
        APERCU_INVITATION
      )
      const blob = octetsVersBlob(pdfGenere, 'application/pdf')
      const url = URL.createObjectURL(blob)
      if (urlApercu) URL.revokeObjectURL(urlApercu)
      definirUrlApercu(url)
      definirApercuOuvert(true)
    } catch (erreur) {
      const message =
        erreur instanceof Error ? erreur.message : 'Aperçu impossible.'
      await afficherErreur('Aperçu impossible', message)
    } finally {
      definirGenerationApercu(false)
    }
  }

  // Nettoie l'URL blob à la fermeture de l'aperçu.
  const fermerApercu = (ouvert: boolean) => {
    if (!ouvert && urlApercu) {
      URL.revokeObjectURL(urlApercu)
      definirUrlApercu(null)
    }
    definirApercuOuvert(ouvert)
  }

  return (
    <GardeEvenementActif>
      <EnTeteOrganisateur
        titre='Modèle d’invitation'
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
        {requeteModele.isLoading ? <SquelettePage /> : null}
        {requeteModele.isError ? (
          <EtatErreur
            message='Impossible de charger le modèle'
            onReessayer={() => void requeteModele.refetch()}
          />
        ) : null}

        <div className='flex flex-wrap items-end gap-3'>
          <div className='flex flex-col gap-2'>
            <Label htmlFor='import-pdf'>PDF modèle</Label>
            <input
              ref={entreeFichier}
              id='import-pdf'
              type='file'
              accept='application/pdf'
              className='hidden'
              onChange={(e) => void importerPdf(e.target.files?.[0])}
            />
            <Button
              type='button'
              variant='outline'
              className='min-h-11'
              onClick={() => entreeFichier.current?.click()}
            >
              <Upload className='size-4' />
              Importer un PDF
            </Button>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='size-11'
              onClick={() => definirZoom((z) => Math.max(0.5, z - 0.1))}
              aria-label='Zoom arrière'
            >
              <Minus className='size-4' />
            </Button>
            <span className='min-w-12 text-center text-sm text-muted-foreground'>
              {Math.round(zoom * 100)} %
            </span>
            <Button
              type='button'
              variant='outline'
              size='icon'
              className='size-11'
              onClick={() => definirZoom((z) => Math.min(2, z + 0.1))}
              aria-label='Zoom avant'
            >
              <Plus className='size-4' />
            </Button>
          </div>
          <Button
            type='button'
            variant='secondary'
            className='min-h-11'
            disabled={!fichierPdf || generationApercu}
            onClick={() => void ouvrirApercu()}
          >
            {generationApercu ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Eye className='size-4' />
            )}
            Aperçu invité fictif
          </Button>
          <Button
            type='button'
            className='min-h-11 hover:bg-principal-hover'
            disabled={!fichierPdf || !zones || mutationSauvegarde.isPending}
            onClick={() => mutationSauvegarde.mutate()}
          >
            {mutationSauvegarde.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <Save className='size-4' />
            )}
            Enregistrer le modèle
          </Button>
        </div>

        {!fichierPdf ? (
          <p className='text-sm text-muted-foreground'>
            Importez votre invitation vierge, puis placez la zone du nom et celle
            du QR code sur le document.
          </p>
        ) : null}

        {fichierPdf ? (
          <div className='overflow-x-auto rounded-xl border border-border bg-muted/30 p-4'>
            <div
              className='relative mx-auto shadow-md'
              style={{ width: largeurAffichee, height: hauteurAffichee }}
            >
              <Document file={fichierPdf} loading={<SquelettePage />}>
                <Page
                  pageNumber={1}
                  width={largeurAffichee}
                  onLoadSuccess={onPageChargee}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
              {rectNom && rectQr ? (
                <>
                  <ZoneRnd
                    libelle='Nom'
                    couleurBordure='border-primary'
                    rect={rectNom}
                    onChange={mettreAJourZoneNom}
                  />
                  <ZoneRnd
                    libelle='QR code'
                    couleurBordure='border-lien'
                    rect={rectQr}
                    onChange={mettreAJourZoneQr}
                  />
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <FeuilleModale
        ouvert={apercuOuvert}
        onFermer={() => fermerApercu(false)}
        titre='Aperçu — Jean Dupont'
        description='Invitation générée avec le modèle et un invité fictif.'
        classNameContenu='max-h-[80vh] overflow-auto p-2'
        pleinEcranMobile
      >
        {urlApercu ? (
          <iframe
            title='Aperçu invitation PDF'
            src={urlApercu}
            className='h-[70vh] w-full rounded-lg border border-border bg-card'
          />
        ) : null}
      </FeuilleModale>
    </GardeEvenementActif>
  )
}
