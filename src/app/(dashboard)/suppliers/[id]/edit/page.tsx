import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { SupplierForm } from '@/components/suppliers/supplier-form'
import type { Supplier } from '@/lib/types/database'

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('suppliers').select('*').eq('supplier_id', id).single()

  if (error || !data) redirect('/suppliers')
  const s = data as Supplier

  return (
    <>
      <PageHeader
        title={`Edit ${s.supplier_name}`}
        description={s.supplier_code}
        backHref="/suppliers"
        backLabel="Suppliers"
      />
      <SupplierForm supplier={s} />
    </>
  )
}
