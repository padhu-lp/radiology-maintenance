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

/**
 * Triage actions. Kept separate from the edit form because these are workflow
 * transitions, not field edits — different permissions, different consequences.
 */
export function RequestActions({
  requestId,
  requestNumber,
  status,
}: {
  requestId: string
  requestNumber: string
  status: RequestStatus
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { isStaff } = useUserRole()

  const [busy, setBusy] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [notes, setNotes] = useState('')

  const closed = status === 'Resolved' || status === 'Cancelled' || status === 'Converted'

  const setStatus = async (next: RequestStatus, extra: Record<string, unknown> = {}) => {
    setBusy(true)
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: next, ...extra } as never)
        .eq('request_id', requestId)
      if (error) throw error

      toast({ title: `${requestNumber} — ${next.toLowerCase()}` })
      setResolving(false)
      setNotes('')
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
        {closed ? (
          <>
            <p className="text-sm text-muted-foreground">
              This request is {status.toLowerCase()}. Reopen it if more work is needed.
            </p>
            <Button variant="outline" size="sm" disabled={busy}
              onClick={() => setStatus('New', { closed_at: null, resolution_notes: null })}>
              Reopen
            </Button>
          </>
        ) : resolving ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">How was it resolved?</Label>
              <Textarea
                id="resolution_notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Advised customer to reseat the detector cable; confirmed working."
              />
              <p className="text-xs text-muted-foreground">
                Use this when no site visit was needed. If a technician must attend,
                convert it to a work order instead.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResolving(false)} disabled={busy}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={busy || notes.trim().length < 5}
                onClick={() => setStatus('Resolved', {
                  resolution_notes: notes.trim(),
                  closed_at: new Date().toISOString(),
                })}
              >
                Mark resolved
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            {status === 'New' && (
              <Button size="sm" variant="outline" disabled={busy}
                onClick={() => setStatus('Triaged')}>
                Mark triaged
              </Button>
            )}

            <Button size="sm" variant="outline" disabled={busy} onClick={() => setResolving(true)}>
              Resolve without a visit
            </Button>

            <Button size="sm" variant="outline" disabled title="Available once work orders are rebuilt">
              Convert to work order
            </Button>

            <Button size="sm" variant="ghost" className="text-red-600" disabled={busy}
              onClick={() => setStatus('Cancelled', { closed_at: new Date().toISOString() })}>
              Cancel request
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
