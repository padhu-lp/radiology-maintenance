'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { EmptyState } from '@/components/layout/page-header'
import { describeDbError, nullBlanks } from '@/lib/errors'
import { useUserRole } from '@/hooks/use-user-role'
import { DASH } from '@/lib/format'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import type { Location, LocationInsert } from '@/lib/types/database'

type Draft = {
  department_name: string
  facility_name: string
  building: string
  floor_level: string
  room_number: string
}

const EMPTY: Draft = {
  department_name: '', facility_name: '', building: '', floor_level: '', room_number: '',
}

/**
 * Sites are edited inside their owning customer rather than as a top-level
 * section: a location has no meaning detached from the customer it belongs to,
 * and this avoids a nav entry that would always start with "pick a customer".
 */
export function LocationManager({
  customerId,
  locations,
}: {
  customerId: string
  locations: Location[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { isAdmin } = useUserRole()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [busy, setBusy] = useState(false)

  const startAdd = () => { setDraft(EMPTY); setEditingId(null); setAdding(true) }
  const startEdit = (l: Location) => {
    setDraft({
      department_name: l.department_name,
      facility_name: l.facility_name ?? '',
      building: l.building ?? '',
      floor_level: l.floor_level ?? '',
      room_number: l.room_number ?? '',
    })
    setAdding(false)
    setEditingId(l.location_id)
  }
  const cancel = () => { setAdding(false); setEditingId(null); setDraft(EMPTY) }

  const save = async () => {
    if (draft.department_name.trim().length < 2) {
      toast({ title: 'Department name required', variant: 'destructive' })
      return
    }
    setBusy(true)
    try {
      const payload = nullBlanks(draft) as unknown as LocationInsert

      if (editingId) {
        const { error } = await supabase.from('locations').update(payload).eq('location_id', editingId)
        if (error) throw error
        toast({ title: 'Site updated' })
      } else {
        const { error } = await supabase
          .from('locations')
          .insert({ ...payload, customer_id: customerId } as LocationInsert)
        if (error) throw error
        toast({ title: 'Site added' })
      }
      cancel()
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (l: Location) => {
    if (!confirm(`Remove "${l.department_name}"? Equipment there will keep its record but lose the site link.`)) return
    setBusy(true)
    try {
      const { error } = await supabase.from('locations').delete().eq('location_id', l.location_id)
      if (error) throw error
      toast({ title: 'Site removed' })
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const field = (k: keyof Draft, label: string, required = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={k} className="text-xs">{label}{required && ' *'}</Label>
      <Input
        id={k}
        value={draft[k]}
        onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
        className="h-9"
      />
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Sites &amp; departments</CardTitle>
        {isAdmin && !adding && !editingId && (
          <Button size="sm" variant="outline" onClick={startAdd}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Add site
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {(adding || editingId) && (
          <div className="border-y bg-slate-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {field('department_name', 'Department', true)}
              {field('facility_name', 'Facility')}
              {field('building', 'Building')}
              {field('floor_level', 'Floor')}
              {field('room_number', 'Room')}
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>
                <X className="mr-1.5 h-3.5 w-3.5" />Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save site' : 'Add site'}
              </Button>
            </div>
          </div>
        )}

        {locations.length === 0 && !adding ? (
          <EmptyState
            title="No sites recorded"
            description="Sites let you place equipment in a specific department or room."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Room</TableHead>
                {isAdmin && <TableHead className="w-20" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((l) => (
                <TableRow key={l.location_id}>
                  <TableCell className="font-medium">{l.department_name}</TableCell>
                  <TableCell>{l.facility_name ?? DASH}</TableCell>
                  <TableCell>{l.building ?? DASH}</TableCell>
                  <TableCell>{l.room_number ?? DASH}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(l)} disabled={busy}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(l)} disabled={busy}>
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
