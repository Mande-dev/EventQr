import Swal, { type SweetAlertIcon, type SweetAlertResult } from 'sweetalert2'

type OptionsAlerte = {
  titre: string
  texte?: string
  icone?: SweetAlertIcon
  boutonConfirmer?: string
  boutonAnnuler?: string
  destructif?: boolean
}

const OPTIONS_BASE = {
  heightAuto: false,
  buttonsStyling: false,
  reverseButtons: true,
  focusConfirm: false,
  allowOutsideClick: false,
  allowEscapeKey: true,
  customClass: {
    popup: 'eventqr-swal-popup',
    title: 'eventqr-swal-title',
    htmlContainer: 'eventqr-swal-texte',
    actions: 'eventqr-swal-actions',
    confirmButton: 'eventqr-swal-confirmer',
    cancelButton: 'eventqr-swal-annuler',
    icon: 'eventqr-swal-icone',
  },
} as const

/** Durée d’affichage d’une alerte succès (sans bouton). */
const DUREE_SUCCES_MS = 1800

// Affiche une alerte centrée (succès, erreur, info, attention).
export const afficherAlerte = async (
  options: OptionsAlerte
): Promise<SweetAlertResult> =>
  Swal.fire({
    ...OPTIONS_BASE,
    icon: options.icone ?? 'info',
    title: options.titre,
    text: options.texte,
    confirmButtonText: options.boutonConfirmer ?? 'OK',
    showCancelButton: false,
  })

/**
 * Affiche un succès centré sans bouton OK :
 * fermeture automatique après un court délai.
 */
export const afficherSucces = async (
  titre: string,
  texte?: string
): Promise<void> => {
  await Swal.fire({
    ...OPTIONS_BASE,
    icon: 'success',
    title: titre,
    text: texte,
    showConfirmButton: false,
    timer: DUREE_SUCCES_MS,
    timerProgressBar: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
  })
}

// Affiche une alerte d'erreur centrée.
export const afficherErreur = async (
  titre: string,
  texte?: string
): Promise<void> => {
  await afficherAlerte({ titre, texte, icone: 'error' })
}

// Affiche une alerte d'information centrée.
export const afficherInformation = async (
  titre: string,
  texte?: string
): Promise<void> => {
  await afficherAlerte({ titre, texte, icone: 'info' })
}

// Affiche une alerte d'attention centrée.
export const afficherAttention = async (
  titre: string,
  texte?: string
): Promise<void> => {
  await afficherAlerte({ titre, texte, icone: 'warning' })
}

/**
 * Ferme d’abord une FeuilleModale / overlay, attend le démontage,
 * puis exécute une action (ex. SweetAlert) pour éviter le blocage des clics.
 */
export const apresFermetureOverlay = async (
  fermer: () => void,
  action: () => Promise<void>,
  delaiMs = 200
): Promise<void> => {
  fermer()
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, delaiMs)
  })
  await action()
}

// Demande une confirmation centrée avant une action sensible (Oui / Non).
export const demanderConfirmation = async (
  options: OptionsAlerte
): Promise<boolean> => {
  const resultat = await Swal.fire({
    ...OPTIONS_BASE,
    icon: options.icone ?? (options.destructif ? 'warning' : 'question'),
    title: options.titre,
    text: options.texte,
    showCancelButton: true,
    confirmButtonText: options.boutonConfirmer ?? 'Oui',
    cancelButtonText: options.boutonAnnuler ?? 'Non',
    customClass: {
      ...OPTIONS_BASE.customClass,
      confirmButton: options.destructif
        ? 'eventqr-swal-confirmer eventqr-swal-confirmer--destructif'
        : 'eventqr-swal-confirmer',
    },
  })

  return resultat.isConfirmed
}
