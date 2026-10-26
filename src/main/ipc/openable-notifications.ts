// Click routes of shown notifications, newest last. Kept past the banner's retention window so the
// shortcut still reaches an agent that has waited longer; cleared on open, read, or replacement.
const MAX_OPENABLE_NOTIFICATIONS = 50

type OpenableNotificationKey = { id?: string; paneKey?: string }
type OpenableNotification = OpenableNotificationKey & { open: () => void }

const openableNotifications: OpenableNotification[] = []

/** Register a shown notification's open route; the returned function unregisters it. */
export function registerOpenableNotification(
  open: () => void,
  { id, paneKey }: OpenableNotificationKey = {}
): () => void {
  if (id) {
    forgetOpenableNotifications([id])
  }
  const entry: OpenableNotification = { id, paneKey, open }
  openableNotifications.push(entry)
  if (openableNotifications.length > MAX_OPENABLE_NOTIFICATIONS) {
    openableNotifications.shift()
  }
  return () => {
    const index = openableNotifications.indexOf(entry)
    if (index !== -1) {
      openableNotifications.splice(index, 1)
    }
  }
}

/** Drop notifications Orca retired as read, so the shortcut skips work the user already saw.
 * Pane reads retire only id-less notifications such as terminal bells; notifications with an id
 * follow the ids Orca retires, so positioned alerts past a read boundary stay openable. */
export function forgetOpenableNotifications(
  ids: Iterable<string>,
  paneKeys: Iterable<string> = []
): void {
  const retiredIds = new Set(ids)
  const readPaneKeys = new Set(paneKeys)
  for (let index = openableNotifications.length - 1; index >= 0; index -= 1) {
    const { id, paneKey } = openableNotifications[index]
    if (id ? retiredIds.has(id) : paneKey !== undefined && readPaneKeys.has(paneKey)) {
      openableNotifications.splice(index, 1)
    }
  }
}

export function hasOpenableNotification(): boolean {
  return openableNotifications.length > 0
}

/** Open the newest notification as if it were clicked; false when none remains. */
export function openLatestNotification(): boolean {
  const entry = openableNotifications.pop()
  if (!entry) {
    return false
  }
  entry.open()
  return true
}
