import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { CustomerForm } from '@/components/customers/customer-form'
import type { Customer } from '@/lib/types/database'

// Next.js 16: params is a Promise and must be awaited.
export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('customer_id', id)
    .single()

  if (error || !data) redirect('/customers')

  const customer = data as Customer

  return (
    <>
      <PageHeader
        title={`Edit ${customer.customer_name}`}
        description={customer.customer_code}
        backHref={`/customers/${id}`}
        backLabel="Back to customer"
      />
      <CustomerForm customer={customer} />
    </>
  )
}
