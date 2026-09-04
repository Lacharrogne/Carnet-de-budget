import { useEffect, useState } from 'react'

import {
  INSTALL_AVAILABILITY_EVENT,
  clearDeferredPrompt,
  getDeferredPrompt,
  type BeforeInstallPromptEvent,
} from '../lib/installPrompt'
import { Download, Share, X } from 'lucide-react'

/**
 * Bannière discrète « Installer l'application » (PWA).
 *
 * - Android/Chrome : capte `beforeinstallprompt` et déclenche l'invite native.
 * - iOS/Safari : `beforeinstallprompt` n'existe pas → on affiche la marche à
 *   suivre manuelle (Partager → Sur l'écran d'accueil).
 * - Masquée si déjà installée (mode standalone) ou déjà refusée une fois.
 */

const DISMISS_KEY = 'installPromptDismissed'

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/**
 * Peut-on encore proposer l'installation ? (application non installée et
 * proposition pas déjà refusée). Lu à l'initialisation des états, plutôt que
 * posé depuis un effet — l'événement arrive souvent avant le montage.
 */
function canPrompt(): boolean {
  if (typeof window === 'undefined') return false
  if (isStandalone()) return false
  try {
    if (localStorage.getItem(DISMISS_KEY)) return false
  } catch {
    /* localStorage indisponible : on continue sans mémoire */
  }
  return true
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(() =>
    canPrompt() ? getDeferredPrompt() : null,
  )
  const [visible, setVisible] = useState(
    () => canPrompt() && (getDeferredPrompt() !== null || isIos()),
  )
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    if (!canPrompt()) return

    // On réagit aux changements de disponibilité (événement capté après le
    // montage, ou remis à zéro après installation).
    const onAvailability = () => {
      const current = getDeferredPrompt()
      setDeferred(current)
      if (current) {
        setVisible(true)
      }
    }
    window.addEventListener(INSTALL_AVAILABILITY_EVENT, onAvailability)

    const onInstalled = () => {
      setVisible(false)
      try {
        localStorage.setItem(DISMISS_KEY, '1')
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener(INSTALL_AVAILABILITY_EVENT, onAvailability)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const install = async () => {
    if (isIos()) {
      setShowIosHelp((value) => !value)
      return
    }
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    clearDeferredPrompt()
    setDeferred(null)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md animate-[fadeIn_0.3s_ease] sm:inset-x-auto sm:left-1/2 sm:w-[26rem] sm:-translate-x-1/2">
      <div className="rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-2xl shadow-emerald-900/10 backdrop-blur">
        <div className="flex items-start gap-3">
          <img
            src="/icon-192.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-xl shadow-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-black text-slate-800">
              Installer Carnet de budget
            </p>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Ajoutez l'app à votre écran d'accueil pour un accès direct, en
              plein écran.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Masquer"
            className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-stone-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {showIosHelp ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-900">
            Appuyez sur
            <Share className="mx-0.5 inline h-3.5 w-3.5" />
            puis « Sur l'écran d'accueil ».
          </p>
        ) : (
          <button
            type="button"
            onClick={install}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:bg-emerald-500"
          >
            <Download className="h-4 w-4" />
            {isIos() ? "Comment installer" : "Installer l'application"}
          </button>
        )}
      </div>
    </div>
  )
}
