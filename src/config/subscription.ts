/**
 * Réglages de l'essai gratuit et de l'abonnement.
 *
 * Modèle retenu : essai gratuit (toutes les fonctionnalités), puis abonnement
 * pour continuer. Tant que le paiement n'est pas branché, on NE bloque
 * personne : il suffira de passer `ENFORCE_TRIAL` à `true` le jour venu.
 */

/** Durée de l'essai gratuit, en jours (aligné sur la vitrine). */
/**
 * Identifiant de ce carnet dans le modèle d'abonnement par carnet.
 * Un abonnement débloque ce carnet si son `plan` vaut ce carnet ou `all`.
 */
export const CARNET = 'budget'

export const TRIAL_DURATION_DAYS = 14

/**
 * Quand `false`, l'accès reste ouvert à tous même après l'essai (on affiche
 * seulement un rappel). Passez à `true` une fois le paiement en place pour
 * verrouiller l'app à la fin de l'essai (sauf abonnés).
 */
export const ENFORCE_TRIAL = true

/**
 * Le paiement et la gestion de l'abonnement sont centralisés sur la vitrine
 * « Les Carnets » : un seul abonnement débloque tous les carnets. Les boutons
 * d'abonnement de l'app renvoient donc vers la page Tarifs de la vitrine.
 */
export const VITRINE_URL = 'https://lescarnets.app'
export const SUBSCRIPTION_HUB_URL = `${VITRINE_URL}/#hub`

/**
 * Adresse vers laquelle pointent les boutons « Passer à l'abonnement » : la
 * page Tarifs de la vitrine (hub commun).
 */
export const UPGRADE_URL: string | null = SUBSCRIPTION_HUB_URL

/** Contact utilisé en repli tant qu'il n'y a pas de page de paiement. */
export const CONTACT_EMAIL = 'maxi.charr@gmail.com'
