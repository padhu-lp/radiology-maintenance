'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { EmptyState } from '@/components/layout/page-header'
import { useUserRole } from '@/hooks/use-user-role'
import { describeDbError } from '@/lib/errors'
import { DASH } from '@/lib/format'
import { ASSIGNMENT_ROLES } from '@/lib/types/database'
import { Plus, Trash2, X } from 'lucide-react'

export type Assignment = {
  assignment_id: string
  technician_id: string
  role: string
  hours_worked: number | null
  notes: string | null
  technicians: {
    first_name: string; last_name: string
    technician_code: string; specialization: string | null
  } | null
}

export function TechnicianAssignments({
  workOrderId,
  assignments,
  locked,
}: {
  workOrderId: string
  assignments: Assignment[]
  locked: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { isStaff } = useUserRole()

  const [techs, setTechs] = useState<{ id: string; label: string }[]>([])
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [techId, setTechId] = useState('')
  const [role, setRole] = useState<string>('Lead')
  const [hours, setHours] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('technicians')
        .select('technician_id, first_name, last_name, technician_code, specialization')
        .eq('is_active', true)
        .order('first_name')
      setTechs((data ?? []).map((t) => ({
        id: t.technician_id,
        label: `${t.first_name} ${t.last_name} (${t.technician_code})${t.specialization ? ` — ${t.specialization}` : ''}`,
      })))
    }
    load()
  }, [supabase])

  // Already-assigned people are filtered out; the UNIQUE constraint would
  // reject a duplicate anyway, but offering it would be a trap.
  const available = techs.filter((t) => !assignments.some((a) => a.technician_id === t.id))

  const reset = () => { setAdding(false); setTechId(''); setRole('Lead'); setHours('') }

  const add = async () => {
    if (!techId) { toast({ title: 'Select a technician', variant: 'destructive' }); return }
    setBusy(true)
    try {
      const { error } = await supabase.from('workorder_technicians').insert({
        workorder_id: workOrderId,
        technician_id: techId,
        role,
        hours_worked: hours === '' ? null : Number(hours),
      } as never)
      if (error) throw error
      toast({ title: 'Technician assigned' })
      reset()
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (a: Assignment) => {
    const name = a.technicians ? `${a.technicians.first_name} ${a.technicians.last_name}` : 'this technician'
    if (!confirm(`Remove ${name} from this work order?`)) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('workorder_technicians').delete().eq('assignment_id', a.assignment_id)
      if (error) throw error
      toast({ title: 'Assignment removed' })
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const totalHours = assignments.reduce((sum, a) => sum + (Number(a.hours_worked) || 0), 0)
  const canEdit = isStaff && !locked

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Technicians
          {totalHours > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {totalHours.toFixed(2)} h total
            </span>
          )}
        </CardTitle>
        {canEdit && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Assign
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {adding && (
          <div className="border-y bg-slate-50 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Technician</Label>
                <Select value={techId} onValueChange={setTechId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select technician" /></SelectTrigger>
                  <SelectContent>
                    {available.length === 0
                      ? <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {techs.length === 0 ? 'No active technicians' : 'All technicians already assigned'}
                        </div>
                      : available.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hours worked</Label>
                <Input className="h-9" type="number" step="0.25" min="0"
                  value={hours} onChange={(e) => setHours(e.target.value)} placeholder="optional" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
                <X className="mr-1.5 h-3.5 w-3.5" />Cancel
              </Button>
              <Button size="sm" onClick={add} disabled={busy || !techId}>
                {busy ? 'Assigning…' : 'Assign'}
              </Button>
            </div>
          </div>
        )}

        {assignments.length === 0 && !adding ? (
          <EmptyState
            title="No technicians assigned"
            description="Assign who is attending so hours and accountability are recorded."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.assignment_id}>
                  <TableCell className="font-medium">
                    {a.technicians ? `${a.technicians.first_name} ${a.technicians.last_name}` : DASH}
                    {a.technicians?.specialization && (
                      <span className="block text-xs text-muted-foreground">
                        {a.technicians.specialization}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {a.hours_worked === null ? DASH : Number(a.hours_worked).toFixed(2)}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(a)} disabled={busy}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {locked && assignments.length > 0 && (
          <p className="px-4 py-3 text-xs text-muted-foreground border-t">
            This work order is closed. Reopen it to change assignments.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
