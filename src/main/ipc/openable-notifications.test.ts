import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  forgetOpenableNotifications,
  hasOpenableNotification,
  openLatestNotification,
  registerOpenableNotification
} from './openable-notifications'

afterEach(() => {
  while (openLatestNotification()) {
    // drain the module-level list between tests
  }
})

describe('openable notifications', () => {
  it('opens the newest registered notification first, then the older ones', () => {
    const older = vi.fn()
    const newer = vi.fn()
    registerOpenableNotification(older)
    registerOpenableNotification(newer)

    expect(openLatestNotification()).toBe(true)
    expect(newer).toHaveBeenCalledTimes(1)
    expect(older).not.toHaveBeenCalled()

    expect(openLatestNotification()).toBe(true)
    expect(older).toHaveBeenCalledTimes(1)

    expect(hasOpenableNotification()).toBe(false)
    expect(openLatestNotification()).toBe(false)
  })

  it('skips notifications that were unregistered before the shortcut fired', () => {
    const kept = vi.fn()
    const clicked = vi.fn()
    registerOpenableNotification(kept)
    const unregister = registerOpenableNotification(clicked)
    unregister()
    // A repeated unregister must not drop another entry.
    unregister()

    expect(openLatestNotification()).toBe(true)
    expect(kept).toHaveBeenCalledTimes(1)
    expect(clicked).not.toHaveBeenCalled()
  })

  it('replaces an earlier notification with the same id', () => {
    const first = vi.fn()
    const replacement = vi.fn()
    registerOpenableNotification(first, { id: 'agent-1' })
    registerOpenableNotification(replacement, { id: 'agent-1' })

    expect(openLatestNotification()).toBe(true)
    expect(replacement).toHaveBeenCalledTimes(1)
    expect(openLatestNotification()).toBe(false)
    expect(first).not.toHaveBeenCalled()
  })

  it('forgets notifications retired as read by id', () => {
    const unread = vi.fn()
    const read = vi.fn()
    registerOpenableNotification(unread, { id: 'unread' })
    registerOpenableNotification(read, { id: 'read' })

    forgetOpenableNotifications(['read'])

    expect(openLatestNotification()).toBe(true)
    expect(unread).toHaveBeenCalledTimes(1)
    expect(read).not.toHaveBeenCalled()
  })

  it('keeps only the 50 newest notifications', () => {
    const opens = Array.from({ length: 51 }, () => vi.fn())
    for (const open of opens) {
      registerOpenableNotification(open)
    }

    let opened = 0
    while (openLatestNotification()) {
      opened += 1
    }

    expect(opened).toBe(50)
    expect(opens[0]).not.toHaveBeenCalled()
    expect(opens[50]).toHaveBeenCalledTimes(1)
  })
})
