import type { UserPresence, CollaborativeActivityEntry } from '../../types'

export class PresenceService {
  /**
   * Generates mock active workspace collaborators
   */
  static getInitialCollaborators(): UserPresence[] {
    return [
      {
        userId: 'usr-owner-01',
        userName: 'Faqih (Owner)',
        userEmail: 'owner@satria.ai',
        avatar: '',
        role: 'Owner',
        currentRoute: '/work',
        status: 'ONLINE',
        lastActiveAt: new Date().toISOString()
      },
      {
        userId: 'usr-eng-lead',
        userName: 'Raka Pratama',
        userEmail: 'raka@satria.internal',
        avatar: '',
        role: 'Manager',
        currentRoute: '/delegation',
        status: 'ONLINE',
        lastActiveAt: new Date().toISOString()
      },
      {
        userId: 'usr-ops-mgr',
        userName: 'Siti Rahma',
        userEmail: 'siti@satria.internal',
        avatar: '',
        role: 'Engineer',
        currentRoute: '/governance',
        status: 'IDLE',
        lastActiveAt: new Date(Date.now() - 1000 * 120).toISOString()
      }
    ]
  }

  /**
   * Creates an activity log entry
   */
  static createActivity(
    actorName: string,
    action: string,
    entityType: CollaborativeActivityEntry['entityType'],
    entityId: string,
    entityTitle: string
  ): CollaborativeActivityEntry {
    return {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorId: 'usr-owner-01',
      actorName,
      actorAvatar: '',
      action,
      entityType,
      entityId,
      entityTitle,
      timestamp: new Date().toISOString()
    }
  }
}
