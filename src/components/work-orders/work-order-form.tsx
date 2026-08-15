'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const WORKORDER_TYPES = ['Preventive', 'Corrective', 'Emergency', 'Calibration'] as const
const PRIORITIES = ['Emergency', 'High', 'Medium', 'Low'] as const
const STATUSES = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled'] as const

// z.coerce.number() maps '' to 0, so an untouched numeric input would be saved
// as a real zero. Strip blanks to undefined first so they land as NULL.
const optionalNumber = z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(0).optional()
)

const workOrderSchema = z.object({
    equipment_id: z.string().min(1, 'Please select equipment'),
    workorder_type: z.enum(WORKORDER_TYPES),
    priority: z.enum(PRIORITIES),
    problem_description: z.string().min(10, 'Description must be at least 10 characters'),
    requested_by: z.string().min(2, 'Requester name is required'),
    fault_code: z.string().optional().or(z.literal('')),

    status: z.enum(STATUSES).default('Open'),
    assigned_technician: z.string().optional().or(z.literal('')),
    service_provider: z.string().optional().or(z.literal('')),
    scheduled_date: z.string().optional().or(z.literal('')),
    start_date: z.string().optional().or(z.literal('')),

    completion_date: z.string().optional().or(z.literal('')),
    downtime_hours: optionalNumber,
    work_description: z.string().optional().or(z.literal('')),
    resolution: z.string().optional().or(z.literal('')),

    labor_hours: optionalNumber,
    labor_cost: optionalNumber,
    parts_cost: optionalNumber,
}).superRefine((data, ctx) => {
    // Closing a work order requires evidence of what was actually done.
    if (data.status === 'Completed') {
        if (!data.resolution || data.resolution.trim().length < 10) {
            ctx.addIssue({
                code: 'custom',
                path: ['resolution'],
                message: 'A resolution of at least 10 characters is required to complete a work order',
            })
        }
        if (!data.completion_date) {
            ctx.addIssue({
                code: 'custom',
                path: ['completion_date'],
                message: 'Completion date is required to complete a work order',
            })
        }
    }

    if (data.completion_date && data.start_date && data.completion_date < data.start_date) {
        ctx.addIssue({
            code: 'custom',
            path: ['completion_date'],
            message: 'Completion date cannot be before the start date',
        })
    }
})

type WorkOrderFormData = z.infer<typeof workOrderSchema>

interface WorkOrderFormProps {
    initialData?: Partial<WorkOrderFormData> & { workorder_id?: string; workorder_number?: string }
    mode?: 'create' | 'edit'
}

/** Empty strings and undefined are not valid for DATE / NUMERIC columns. */
function blanksToNull<T extends Record<string, unknown>>(data: T) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(data)) {
        const isBlank =
            v === '' ||
            v === undefined ||
            (typeof v === 'number' && Number.isNaN(v))
        out[k] = isBlank ? null : v
    }
    return out
}

export function WorkOrderForm({ initialData, mode = 'create' }: WorkOrderFormProps) {
    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [equipment, setEquipment] = useState<any[]>([])
    const [technicians, setTechnicians] = useState<any[]>([])
    const [loadingEquipment, setLoadingEquipment] = useState(true)

    const isEdit = mode === 'edit'

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors },
    } = useForm<WorkOrderFormData>({
        resolver: zodResolver(workOrderSchema) as any,
        defaultValues: {
            status: 'Open',
            ...initialData,
        } as any,
    })

    const status = watch('status')
    const laborCost = watch('labor_cost')
    const partsCost = watch('parts_cost')
    const totalCost = (Number(laborCost) || 0) + (Number(partsCost) || 0)

    useEffect(() => {
        const load = async () => {
            const [eq, tech] = await Promise.all([
                supabase
                    .from('inventory')
                    .select('equipment_id, equipment_name, inventory_number')
                    .order('equipment_name', { ascending: true }),
                supabase
                    .from('technicians')
                    .select('technician_id, first_name, last_name, technician_code')
                    .eq('is_active', true)
                    .order('first_name', { ascending: true }),
            ])

            if (eq.error) {
                toast({
                    title: 'Error',
                    description: 'Failed to load equipment list',
                    variant: 'destructive',
                })
            }
            setEquipment(eq.data || [])
            setTechnicians(tech.data || [])
            setLoadingEquipment(false)
        }

        load()
    }, [supabase, toast])

    // Completing a work order without a date is the common case - fill today's
    // date so the user does not have to.
    useEffect(() => {
        if (status === 'Completed' && !watch('completion_date')) {
            setValue('completion_date', new Date().toISOString().slice(0, 10))
        }
    }, [status, setValue, watch])

    const onSubmit = async (data: WorkOrderFormData) => {
        setIsSubmitting(true)

        try {
            const payload = {
                ...blanksToNull(data),
                total_cost: totalCost || null,
                last_modified: new Date().toISOString(),
            }

            if (isEdit && initialData?.workorder_id) {
                const { error } = await (supabase.from('work_orders') as any)
                    .update(payload)
                    .eq('workorder_id', initialData.workorder_id)

                if (error) throw error

                toast({
                    title: 'Saved',
                    description: `Work order ${initialData.workorder_number ?? ''} updated`,
                })
                router.push(`/work-orders/${initialData.workorder_id}`)
            } else {
                const { error } = await (supabase.from('work_orders') as any).insert([{
                    ...payload,
                    workorder_number: `WO-${Date.now()}`,
                    request_date: new Date().toISOString(),
                }])

                if (error) throw error

                toast({ title: 'Success', description: 'Work order created successfully' })
                router.push('/work-orders')
            }

            router.refresh()
        } catch (error: any) {
            // 42501 is the Postgres insufficient_privilege code that RLS raises.
            const denied = error?.code === '42501' || error?.message?.includes('row-level security')
            toast({
                title: denied ? 'Permission denied' : 'Error',
                description: denied
                    ? 'Your account does not have permission to change work orders. Ask an administrator for technician access.'
                    : error?.message || 'Failed to save work order',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isEdit
                            ? `Edit Work Order ${initialData?.workorder_number ?? ''}`
                            : 'Create New Work Order'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="equipment_id">Equipment *</Label>
                            {loadingEquipment ? (
                                <div className="p-2 text-gray-500">Loading equipment...</div>
                            ) : (
                                <Controller
                                    name="equipment_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select value={field.value || ''} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select equipment" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {equipment.length === 0 ? (
                                                    <div className="p-2 text-gray-500">No equipment available</div>
                                                ) : (
                                                    equipment.map((item) => (
                                                        <SelectItem key={item.equipment_id} value={item.equipment_id}>
                                                            {item.equipment_name} ({item.inventory_number})
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            )}
                            {errors.equipment_id && (
                                <p className="text-sm text-red-500">{errors.equipment_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workorder_type">Type *</Label>
                            <Controller
                                name="workorder_type"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value || ''} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WORKORDER_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.workorder_type && (
                                <p className="text-sm text-red-500">{errors.workorder_type.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority *</Label>
                            <Controller
                                name="priority"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value || ''} onValueChange={field.onChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PRIORITIES.map((p) => (
                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.priority && (
                                <p className="text-sm text-red-500">{errors.priority.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requested_by">Requested By *</Label>
                            <Input {...register('requested_by')} placeholder="Enter requester name" />
                            {errors.requested_by && (
                                <p className="text-sm text-red-500">{errors.requested_by.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fault_code">Fault Code</Label>
                            <Input {...register('fault_code')} placeholder="e.g. E-1042" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="problem_description">Problem Description *</Label>
                        <Textarea
                            {...register('problem_description')}
                            rows={4}
                            placeholder="Describe the problem in detail..."
                        />
                        {errors.problem_description && (
                            <p className="text-sm text-red-500">{errors.problem_description.message}</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {isEdit && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignment &amp; Scheduling</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value || 'Open'} onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUSES.map((s) => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="assigned_technician">Assigned Technician</Label>
                                    <Controller
                                        name="assigned_technician"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value || ''} onValueChange={field.onChange}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {technicians.length === 0 ? (
                                                        <div className="p-2 text-gray-500">No active technicians</div>
                                                    ) : (
                                                        technicians.map((t) => {
                                                            const name = `${t.first_name} ${t.last_name}`
                                                            return (
                                                                <SelectItem key={t.technician_id} value={name}>
                                                                    {name} ({t.technician_code})
                                                                </SelectItem>
                                                            )
                                                        })
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service_provider">Service Provider</Label>
                                    <Input {...register('service_provider')} placeholder="External vendor, if any" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_date">Scheduled Date</Label>
                                    <Input type="date" {...register('scheduled_date')} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input type="date" {...register('start_date')} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Work Performed</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="completion_date">
                                        Completion Date {status === 'Completed' && '*'}
                                    </Label>
                                    <Input type="date" {...register('completion_date')} />
                                    {errors.completion_date && (
                                        <p className="text-sm text-red-500">{errors.completion_date.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="downtime_hours">Downtime (hours)</Label>
                                    <Input type="number" step="0.25" min="0" {...register('downtime_hours')} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="work_description">Work Description</Label>
                                <Textarea
                                    {...register('work_description')}
                                    rows={3}
                                    placeholder="What was done..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resolution">
                                    Resolution {status === 'Completed' && '*'}
                                </Label>
                                <Textarea
                                    {...register('resolution')}
                                    rows={3}
                                    placeholder="How the problem was resolved..."
                                />
                                {errors.resolution && (
                                    <p className="text-sm text-red-500">{errors.resolution.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Costs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="labor_hours">Labour Hours</Label>
                                    <Input type="number" step="0.25" min="0" {...register('labor_hours')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="labor_cost">Labour Cost</Label>
                                    <Input type="number" step="0.01" min="0" {...register('labor_cost')} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parts_cost">Parts Cost</Label>
                                    <Input type="number" step="0.01" min="0" {...register('parts_cost')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Cost</Label>
                                    <div className="h-9 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                                        {totalCost.toFixed(2)}
                                    </div>
                                    <p className="text-xs text-gray-500">Calculated automatically</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/work-orders')}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                        ? (isEdit ? 'Saving...' : 'Creating...')
                        : (isEdit ? 'Save Changes' : 'Create Work Order')}
                </Button>
            </div>
        </form>
    )
}
