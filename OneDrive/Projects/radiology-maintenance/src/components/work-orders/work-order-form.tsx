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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const workOrderSchema = z.object({
    equipment_id: z.string().min(1, 'Please select equipment'),
    workorder_type: z.enum(['Preventive', 'Corrective', 'Emergency', 'Calibration']),
    priority: z.enum(['Emergency', 'High', 'Medium', 'Low']),
    problem_description: z.string().min(10, 'Description must be at least 10 characters'),
    requested_by: z.string().min(2, 'Requester name is required'),
})

type WorkOrderFormData = z.infer<typeof workOrderSchema>

export function WorkOrderForm() {
    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [equipment, setEquipment] = useState<any[]>([])
    const [loadingEquipment, setLoadingEquipment] = useState(true)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors }
    } = useForm<WorkOrderFormData>({
        resolver: zodResolver(workOrderSchema) as any,
    })

    // Fetch equipment list on component mount
    useEffect(() => {
        const fetchEquipment = async () => {
            try {
                const { data, error } = await supabase
                    .from('inventory')
                    .select('equipment_id, equipment_name, inventory_number')
                    .eq('status', 'Active')
                    .order('equipment_name', { ascending: true })

                if (error) throw error
                setEquipment(data || [])
            } catch (error) {
                console.error('Error fetching equipment:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load equipment list',
                    variant: 'destructive',
                })
            } finally {
                setLoadingEquipment(false)
            }
        }

        fetchEquipment()
    }, [supabase, toast])

    const onSubmit = async (data: WorkOrderFormData) => {
        setIsSubmitting(true)

        try {
            // Generate work order number
            const workorderNumber = `WO-${Date.now()}`

            const { error } = await (supabase
                .from('work_orders') as any)
                .insert([
                    {
                        ...data,
                        workorder_number: workorderNumber,
                        status: 'Open',
                        request_date: new Date().toISOString(),
                    }
                ])

            if (error) throw error

            toast({
                title: 'Success',
                description: 'Work order created successfully',
            })

            router.push('/work-orders')
            router.refresh()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create work order',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Work Order</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="equipment_id">Equipment *</Label>
                            {loadingEquipment ? (
                                <div className="p-2 text-gray-500">Loading equipment...</div>
                            ) : (
                                <Select
                                    value={watch('equipment_id') || ''}
                                    onValueChange={(value) => {
                                        setValue('equipment_id', value)
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select equipment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {equipment.length === 0 ? (
                                            <div className="p-2 text-gray-500">No active equipment available</div>
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
                            {errors.equipment_id && (
                                <p className="text-sm text-red-500">{errors.equipment_id.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="workorder_type">Type *</Label>
                            <Select onValueChange={(value: any) => setValue('workorder_type', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Preventive">Preventive</SelectItem>
                                    <SelectItem value="Corrective">Corrective</SelectItem>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                    <SelectItem value="Calibration">Calibration</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.workorder_type && (
                                <p className="text-sm text-red-500">{errors.workorder_type.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority *</Label>
                            <Select onValueChange={(value: any) => setValue('priority', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Emergency">Emergency</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.priority && (
                                <p className="text-sm text-red-500">{errors.priority.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="requested_by">Requested By *</Label>
                            <Input
                                {...register('requested_by')}
                                placeholder="Enter requester name"
                            />
                            {errors.requested_by && (
                                <p className="text-sm text-red-500">{errors.requested_by.message}</p>
                            )}
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

                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/work-orders')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating...' : 'Create Work Order'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}