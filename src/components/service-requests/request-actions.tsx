'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useUserRole } from '@/hooks/use-user-role'
import { describeDbError } from '@/lib/errors'
import type { RequestStatus } from '@/lib/types/database'

type Mode = 'idle' | 'triage' | 'resolve'

/**
 * Triage actions. Separate from the edit form because these are workflow
 * transitions, not field edits — different permissions, different consequences.
 */
export function RequestActions({
  requestId,
  requestNumber,
  status,
  triageNotes,
  equipmentId,
}: {
  requestId: string
  requestNumber: string
  status: RequestStatus
  triageNotes: string | null
  /** Null when the caller could not identify the machine — blocks conversion. */
  equipmentId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { isStaff } = useUserRole()

  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('idle')
  // Pre-fill so re-triaging amends the existing findings rather than starting blank.
  const [findings, setFindings] = useState(triageNotes ?? '')
  const [resolution, setResolution] = useState('')

  const closed = status === 'Resolved' || status === 'Cancelled' || status === 'Converted'

  const apply = async (next: RequestStatus, extra: Record<string, unknown> = {}) => {
    setBusy(true)
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: next, ...extra } as never)
        .eq('request_id', requestId)
      if (error) throw error

      toast({ title: `${requestNumber} — ${next.toLowerCase()}` })
      setMode('idle')
      setResolution('')
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  if (!isStaff) return null

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Triage</CardTitle></CardHeader>
      <CardContent className="space-y-3">

        {closed && mode === 'idle' && (
          <>
            <p className="text-sm text-muted-foreground">
              This request is {status.toLowerCase()}. Reopen it if more work is needed.
            </p>
            <Button variant="outline" size="sm" disabled={busy}
              onClick={() => apply('New', { closed_at: null, resolution_notes: null })}>
              Reopen
            </Button>
          </>
        )}

        {mode === 'triage' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="triage_notes">Findings &amp; disposition</Label>
              <Textarea
                id="triage_notes"
                rows={4}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="What you diagnosed from the call, and what happens next — e.g. Detector fault suspected from error code E-1042; needs a site visit with a spare detector board."
              />
              <p className="text-xs text-muted-foreground">
                Kept separate from the caller&apos;s description, so the record shows both
                what they reported and what you concluded.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMode('idle')} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" disabled={busy || findings.trim().length < 5}
                onClick={() => apply('Triaged', { triage_notes: findings.trim() })}>
                Save findings &amp; mark triaged
              </Button>
            </div>
          </>
        )}

        {mode === 'resolve' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">How was it resolved?</Label>
              <Textarea
                id="resolution_notes"
                rows={3}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="e.g. Advised customer to reseat the detector cable; confirmed working."
              />
              <p className="text-xs text-muted-foreground">
                Use this when no site visit was needed. If a technician must attend,
                convert it to a work order instead.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMode('idle')} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" disabled={busy || resolution.trim().length < 5}
                onClick={() => apply('Resolved', {
                  resolution_notes: resolution.trim(),
                  closed_at: new Date().toISOString(),
                })}>
                Mark resolved
              </Button>
            </div>
          </>
        )}

        {!closed && mode === 'idle' && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode('triage')}>
              {status === 'New' ? 'Record findings & triage' : 'Update findings'}
            </Button>

            <Button size="sm" variant="outline" disabled={busy} onClick={() => setMode('resolve')}>
              Resolve without a visit
            </Button>

            <Button
              size="sm"
              disabled={busy || !equipmentId}
              title={equipmentId
                ? undefined
                : 'Attach the equipment to this request first — a work order must name the machine'}
              onClick={() => router.push(
                `/work-orders/new?equipment=${equipmentId}&request=${requestId}`
              )}
            >
              Convert to work order
            </Button>

            <Button size="sm" variant="ghost" className="text-red-600" disabled={busy}
              onClick={() => apply('Cancelled', { closed_at: new Date().toISOString() })}>
              Cancel request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
