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
import { DASH, money } from '@/lib/format'
import { Plus, Trash2, X } from 'lucide-react'

export type PartUsage = {
  usage_id: string
  part_id: string
  quantity: number
  unit_cost: number | null
  line_cost: number | null
  notes: string | null
  parts_inventory: {
    part_code: string; part_name: string; part_number: string
    unit_of_measure: string; quantity_on_hand: number
  } | null
}

type PartOption = {
  id: string; label: string; stock: number; cost: number | null; uom: string
}

export function PartsUsed({
  workOrderId,
  equipmentType,
  usages,
  locked,
}: {
  workOrderId: string
  /** Used to surface compatible parts first, not to restrict the list. */
  equipmentType: string | null
  usages: PartUsage[]
  locked: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const { isStaff } = useUserRole()

  const [parts, setParts] = useState<PartOption[]>([])
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [partId, setPartId] = useState('')
  const [qty, setQty] = useState('1')
  const [onlyCompatible, setOnlyCompatible] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('parts_inventory')
        .select('part_id, part_code, part_name, part_number, equipment_type, quantity_on_hand, unit_cost, unit_of_measure')
        .eq('is_active', true)
        .order('part_name')

      setParts((data ?? []).map((p) => {
        const row = p as unknown as {
          part_id: string; part_code: string; part_name: string; part_number: string
          equipment_type: string | null; quantity_on_hand: number
          unit_cost: number | null; unit_of_measure: string
        }
        return {
          id: row.part_id,
          label: `${row.part_name} (${row.part_number})`,
          stock: row.quantity_on_hand,
          cost: row.unit_cost,
          uom: row.unit_of_measure,
          // carried through for filtering
          ...(row.equipment_type ? { type: row.equipment_type } : {}),
        } as PartOption & { type?: string }
      }))
    }
    load()
  }, [supabase])

  const all = parts as (PartOption & { type?: string })[]
  const compatible = equipmentType
    ? all.filter((p) => !p.type || p.type === equipmentType)
    : all
  const shown = onlyCompatible && equipmentType ? compatible : all

  const selected = all.find((p) => p.id === partId)
  const quantity = Number(qty) || 0
  const exceedsStock = Boolean(selected && quantity > selected.stock)

  const reset = () => { setAdding(false); setPartId(''); setQty('1') }

  const add = async () => {
    if (!partId || quantity <= 0) return
    setBusy(true)
    try {
      // unit_cost is intentionally omitted: a trigger copies the catalogue price
      // at the moment of use, so later price changes cannot rewrite history.
      const { error } = await supabase.from('workorder_parts').insert({
        workorder_id: workOrderId,
        part_id: partId,
        quantity,
      } as never)
      if (error) throw error

      toast({ title: 'Part recorded', description: 'Stock and cost updated' })
      reset()
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (u: PartUsage) => {
    const name = u.parts_inventory?.part_name ?? 'this part'
    if (!confirm(`Remove ${u.quantity} × ${name}? The stock will be returned.`)) return
    setBusy(true)
    try {
      const { error } = await supabase
        .from('workorder_parts').delete().eq('usage_id', u.usage_id)
      if (error) throw error
      toast({ title: 'Removed', description: 'Stock returned to inventory' })
      router.refresh()
    } catch (err) {
      const { title, description } = describeDbError(err)
      toast({ title, description, variant: 'destructive' })
    } finally {
      setBusy(false)
    }
  }

  const total = usages.reduce((s, u) => s + (Number(u.line_cost) || 0), 0)
  const canEdit = isStaff && !locked

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Parts used
          {total > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{money(total)}</span>
          )}
        </CardTitle>
        {canEdit && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Record part
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {adding && (
          <div className="border-y bg-slate-50 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs">Part</Label>
                <Select value={partId} onValueChange={setPartId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select part" /></SelectTrigger>
                  <SelectContent>
                    {shown.length === 0
                      ? <div className="px-2 py-1.5 text-sm text-muted-foreground">No parts available</div>
                      : shown.map((p) => (
                          <SelectItem key={p.id} value={p.id} disabled={p.stock <= 0}>
                            {p.label} — {p.stock} {p.uom} in stock
                            {p.stock <= 0 && ' (out of stock)'}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                {equipmentType && (
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setOnlyCompatible((v) => !v)}
                  >
                    {onlyCompatible
                      ? `Showing parts for ${equipmentType} — show all instead`
                      : `Showing all parts — filter to ${equipmentType}`}
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Quantity</Label>
                <Input className="h-9" type="number" min="1" value={qty}
                  onChange={(e) => setQty(e.target.value)} />
              </div>
            </div>

            {selected && (
              <p className="text-xs text-muted-foreground">
                Unit cost {money(selected.cost)} · line total{' '}
                <strong>{money((Number(selected.cost) || 0) * quantity)}</strong>
                {exceedsStock && (
                  <span className="text-red-600 block mt-1">
                    Only {selected.stock} in stock. Recording more would take stock negative,
                    which the database will reject.
                  </span>
                )}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={reset} disabled={busy}>
                <X className="mr-1.5 h-3.5 w-3.5" />Cancel
              </Button>
              <Button size="sm" onClick={add} disabled={busy || !partId || quantity <= 0 || exceedsStock}>
                {busy ? 'Recording…' : 'Record part'}
              </Button>
            </div>
          </div>
        )}

        {usages.length === 0 && !adding ? (
          <EmptyState
            title="No parts recorded"
            description="Recording a part decrements stock and adds its cost to this work order."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                {canEdit && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usages.map((u) => (
                <TableRow key={u.usage_id}>
                  <TableCell className="font-medium">
                    {u.parts_inventory?.part_name ?? DASH}
                    <span className="block text-xs text-muted-foreground font-mono">
                      {u.parts_inventory?.part_number}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.quantity}
                    <span className="text-xs text-muted-foreground"> {u.parts_inventory?.unit_of_measure}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{money(u.unit_cost)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{money(u.line_cost)}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => remove(u)} disabled={busy}>
                        <Trash2 className="h-3.5 w-3.5 text-red-600" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {locked && usages.length > 0 && (
          <p className="px-4 py-3 text-xs text-muted-foreground border-t">
            This work order is closed. Reopen it to change recorded parts.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
