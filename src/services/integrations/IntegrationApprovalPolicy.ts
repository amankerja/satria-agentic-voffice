/**
 * SATRIA AI WORKFORCE — INTEGRATION SPECIFIC APPROVAL POLICY
 *
 * Granular condition-based approval rules for GitHub App and Gmail operations.
 */

import { RecipientSecurityPolicy } from './RecipientSecurityPolicy'
import type { RiskLevel } from '../../types'

export interface ApprovalEvaluationResult {
  requiresApproval: boolean
  riskLevel: RiskLevel
  reason: string
  approvalType: 'Owner' | 'Manager' | 'Auto'
}

export class IntegrationApprovalPolicy {
  private static protectedBranches = ['main', 'master', 'production', 'release']
  private static protectedPathPrefixes = ['.github/', 'security/', 'infra/', 'database/migrations/']

  /**
   * Evaluates GitHub specific operation conditions
   */
  public static evaluateGitHubAction(
    toolName: string,
    args: Record<string, any>
  ): ApprovalEvaluationResult {
    // 1. Pull Request to Main/Production
    if (toolName === 'github.create_pull_request') {
      const base = (args.base || 'main').toLowerCase()
      if (this.protectedBranches.includes(base)) {
        return {
          requiresApproval: true,
          riskLevel: 'HIGH',
          reason: `Penerbitan Pull Request menuju branch terproteksi (${base}) memerlukan persetujuan Owner.`,
          approvalType: 'Owner'
        }
      }
      return {
        requiresApproval: true,
        riskLevel: 'MEDIUM',
        reason: 'Penerbitan Pull Request memerlukan review tim.',
        approvalType: 'Manager'
      }
    }

    // 2. Direct File Update on Critical Infrastructure
    if (toolName === 'github.update_file') {
      const path = (args.path || '').toLowerCase()
      const isProtected = this.protectedPathPrefixes.some((prefix) => path.startsWith(prefix))

      if (isProtected) {
        return {
          requiresApproval: true,
          riskLevel: 'HIGH',
          reason: `Modifikasi file kritis (${path}) memerlukan otorisasi Owner.`,
          approvalType: 'Owner'
        }
      }

      return {
        requiresApproval: false,
        riskLevel: 'MEDIUM',
        reason: 'Pembaruan kode pada branch kerja.',
        approvalType: 'Auto'
      }
    }

    // Default for reads and non-critical branches
    return {
      requiresApproval: false,
      riskLevel: 'LOW',
      reason: 'Operasi pembacaan atau pembuatan branch aman.',
      approvalType: 'Auto'
    }
  }

  /**
   * Evaluates Email / Gmail specific operation conditions
   */
  public static evaluateEmailAction(
    toolName: string,
    args: Record<string, any>,
    allowedDomains?: string[]
  ): ApprovalEvaluationResult {
    // 1. Outbound Send Email
    if (toolName === 'email.send') {
      const recipient = args.to || ''
      const policy = RecipientSecurityPolicy.evaluateRecipient(recipient, allowedDomains)

      if (!policy.allowed) {
        return {
          requiresApproval: true,
          riskLevel: 'CRITICAL',
          reason: policy.reason || 'Penerima email tidak memenuhi kriteria keamanan.',
          approvalType: 'Owner'
        }
      }

      if (policy.isExternal) {
        return {
          requiresApproval: true,
          riskLevel: 'HIGH',
          reason: `Pengiriman email ke domain eksternal (${policy.domain}) mewajibkan persetujuan Manajer sebelum dikirim.`,
          approvalType: 'Manager'
        }
      }

      return {
        requiresApproval: false,
        riskLevel: 'LOW',
        reason: 'Email internal ke domain perusahaan.',
        approvalType: 'Auto'
      }
    }

    // 2. Draft creation and read operations
    return {
      requiresApproval: false,
      riskLevel: 'LOW',
      reason: 'Penyusunan draf email aman untuk dieksekusi tanpa approval.',
      approvalType: 'Auto'
    }
  }
}
