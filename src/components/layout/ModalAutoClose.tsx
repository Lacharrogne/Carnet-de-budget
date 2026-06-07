import { useEffect } from 'react'

function isModalBackdrop(element: HTMLElement) {
  return (
    element.classList.contains('fixed') &&
    element.classList.contains('inset-0') &&
    element.classList.contains('z-50')
  )
}

function findCloseButton(modal: HTMLElement) {
  const ariaCloseButton = modal.querySelector<HTMLButtonElement>(
    'button[aria-label*="Fermer"], button[aria-label*="fermer"]',
  )

  if (ariaCloseButton) {
    return ariaCloseButton
  }

  const buttons = Array.from(modal.querySelectorAll<HTMLButtonElement>('button'))

  return buttons.find((button) => {
    const text = button.textContent?.trim().toLowerCase() ?? ''

    return (
      text === 'annuler' ||
      text === 'compris' ||
      text.includes('fermer')
    )
  })
}

export default function ModalAutoClose() {
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      const target = event.target

      if (!(target instanceof HTMLElement)) {
        return
      }

      if (!isModalBackdrop(target)) {
        return
      }

      const closeButton = findCloseButton(target)

      if (closeButton) {
        closeButton.click()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      const modals = Array.from(
        document.querySelectorAll<HTMLElement>('.fixed.inset-0.z-50'),
      )

      const lastModal = modals.at(-1)

      if (!lastModal) {
        return
      }

      const closeButton = findCloseButton(lastModal)

      if (closeButton) {
        closeButton.click()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return null
}