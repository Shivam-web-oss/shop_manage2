import AdminBusinessDirectory from "@/app/components/admin/admin-business-directory"
import { ROLES, requireRole } from "@/lib/authz"
import { getAdminBusinessDirectory } from "@/lib/admin"

export default async function AdminPage() {
  const context = await requireRole([ROLES.ADMIN])
  const businesses = await getAdminBusinessDirectory(context.supabase)

  return <AdminBusinessDirectory businesses={businesses} />
}
