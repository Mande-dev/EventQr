import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import type { ModeleInvitation } from '@/types'
import { lirePdfModele } from '@/services/modeles-invitation'

export type ZonePdf = {
  x: number
  y: number
  largeur: number
  hauteur: number
}

export type RectangleEcran = {
  x: number
  y: number
  width: number
  height: number
}

/** Données affichées sur une page PDF d’invitation (noms + QR). */
export type DonneesPageInvitationPdf = {
  libelle_noms: string
  code_qr: string
}

/** Convertit une zone PDF (origine bas-gauche) en rectangle écran (origine haut-gauche). */
export function pdfVersEcran(
  zone: ZonePdf,
  hauteurPage: number,
  echelle: number
): RectangleEcran {
  return {
    x: zone.x * echelle,
    y: (hauteurPage - zone.y - zone.hauteur) * echelle,
    width: zone.largeur * echelle,
    height: zone.hauteur * echelle,
  }
}

/** Convertit un rectangle écran en zone PDF (origine bas-gauche). */
export function ecranVersPdf(
  rect: RectangleEcran,
  hauteurPage: number,
  echelle: number
): ZonePdf {
  const largeur = rect.width / echelle
  const hauteur = rect.height / echelle
  const x = rect.x / echelle
  const y = hauteurPage - rect.y / echelle - hauteur
  return { x, y, largeur, hauteur }
}

/** Charge les octets du PDF modèle (IndexedDB, data URL ou chemin public). */
export async function chargerOctetsPdfModele(
  modele: ModeleInvitation
): Promise<Uint8Array> {
  let source = modele.fichier_pdf
  if (source.startsWith('indexeddb://')) {
    const id = modele.id_evenement
    const stocke = await lirePdfModele(id)
    if (!stocke) {
      throw new Error('PDF modèle introuvable.')
    }
    source = stocke
  }
  if (source.startsWith('data:')) {
    const base64 = source.split(',')[1]
    if (!base64) throw new Error('PDF modèle invalide.')
    const binaire = atob(base64)
    const octets = new Uint8Array(binaire.length)
    for (let i = 0; i < binaire.length; i += 1) {
      octets[i] = binaire.charCodeAt(i)
    }
    return octets
  }
  const reponse = await fetch(source)
  if (!reponse.ok) {
    throw new Error('Impossible de charger le PDF modèle.')
  }
  return new Uint8Array(await reponse.arrayBuffer())
}

/** Décode une data URL PDF en octets. */
export function dataUrlVersOctets(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  if (!base64) throw new Error('Fichier PDF invalide.')
  const binaire = atob(base64)
  const octets = new Uint8Array(binaire.length)
  for (let i = 0; i < binaire.length; i += 1) {
    octets[i] = binaire.charCodeAt(i)
  }
  return octets
}

/** Calcule une taille de police adaptée à la zone nom. */
function calculerTaillePolice(texte: string, largeurZone: number): number {
  const base = Math.min(28, largeurZone / Math.max(texte.length * 0.45, 4))
  return Math.max(10, Math.min(base, 32))
}

/** Dessine le libellé des noms et le QR sur une page PDF. */
async function dessinerInvitationSurPage(
  document: PDFDocument,
  pageIndex: number,
  modele: ModeleInvitation,
  donnees: DonneesPageInvitationPdf
): Promise<void> {
  const page = document.getPage(pageIndex)
  const police = await document.embedFont(StandardFonts.HelveticaBold)
  const nomComplet = donnees.libelle_noms.trim()
  const taille = calculerTaillePolice(nomComplet, modele.zone_nom_largeur)
  const largeurTexte = police.widthOfTextAtSize(nomComplet, taille)
  const xTexte =
    modele.zone_nom_x +
    Math.max(0, (modele.zone_nom_largeur - largeurTexte) / 2)
  const yTexte =
    modele.zone_nom_y +
    Math.max(0, (modele.zone_nom_hauteur - taille) / 2)

  page.drawText(nomComplet, {
    x: xTexte,
    y: yTexte,
    size: taille,
    font: police,
    color: rgb(0.04, 0.29, 0.48),
    maxWidth: modele.zone_nom_largeur,
  })

  const qrDataUrl = await QRCode.toDataURL(donnees.code_qr, {
    width: 512,
    margin: 0,
    errorCorrectionLevel: 'M',
  })
  const pngBase64 = qrDataUrl.split(',')[1]
  if (!pngBase64) return
  const pngBytes = dataUrlVersOctets(`data:image/png;base64,${pngBase64}`)
  const image = await document.embedPng(pngBytes)
  page.drawImage(image, {
    x: modele.zone_qr_x,
    y: modele.zone_qr_y,
    width: modele.zone_qr_largeur,
    height: modele.zone_qr_hauteur,
  })
}

/** Génère un PDF multipage (une page par invitation). */
export async function genererPdfMultipage(
  octetsModele: Uint8Array,
  modele: ModeleInvitation,
  invitations: DonneesPageInvitationPdf[],
  onProgress?: (fait: number, total: number) => void
): Promise<Uint8Array> {
  const source = await PDFDocument.load(octetsModele)
  const sortie = await PDFDocument.create()
  const total = invitations.length

  for (let index = 0; index < invitations.length; index += 1) {
    const [pageCopiee] = await sortie.copyPages(source, [0])
    sortie.addPage(pageCopiee)
    await dessinerInvitationSurPage(
      sortie,
      sortie.getPageCount() - 1,
      modele,
      invitations[index]
    )
    onProgress?.(index + 1, total)
  }

  return sortie.save()
}

/** Génère un PDF unique pour une invitation (aperçu ou ZIP). */
export async function genererPdfInvitationUnique(
  octetsModele: Uint8Array,
  modele: ModeleInvitation,
  donnees: DonneesPageInvitationPdf
): Promise<Uint8Array> {
  const source = await PDFDocument.load(octetsModele)
  const sortie = await PDFDocument.create()
  const [pageCopiee] = await sortie.copyPages(source, [0])
  sortie.addPage(pageCopiee)
  await dessinerInvitationSurPage(sortie, 0, modele, donnees)
  return sortie.save()
}

/** Alias historique pour l’aperçu modèle. */
export const genererPdfInviteUnique = genererPdfInvitationUnique

/** Convertit des octets PDF en Blob compatible navigateur. */
export function octetsVersBlob(octets: Uint8Array, typeMime: string): Blob {
  const copie = Uint8Array.from(octets)
  return new Blob([copie], { type: typeMime })
}

/** Déclenche le téléchargement d'un blob côté navigateur. */
export function telechargerBlob(blob: Blob, nomFichier: string): void {
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  lien.click()
  URL.revokeObjectURL(url)
}

/** Zones par défaut centrées sur une page A4-like. */
export function zonesParDefaut(
  largeurPage: number,
  hauteurPage: number
): Pick<
  ModeleInvitation,
  | 'zone_nom_x'
  | 'zone_nom_y'
  | 'zone_nom_largeur'
  | 'zone_nom_hauteur'
  | 'zone_qr_x'
  | 'zone_qr_y'
  | 'zone_qr_largeur'
  | 'zone_qr_hauteur'
> {
  const largeurNom = Math.min(280, largeurPage * 0.6)
  const hauteurNom = 40
  const tailleQr = Math.min(120, largeurPage * 0.25)
  return {
    zone_nom_x: (largeurPage - largeurNom) / 2,
    zone_nom_y: hauteurPage * 0.55,
    zone_nom_largeur: largeurNom,
    zone_nom_hauteur: hauteurNom,
    zone_qr_x: (largeurPage - tailleQr) / 2,
    zone_qr_y: hauteurPage * 0.25,
    zone_qr_largeur: tailleQr,
    zone_qr_hauteur: tailleQr,
  }
}
