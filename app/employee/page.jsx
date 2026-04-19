import EmployeeDashboard from "@/app/components/staff/page"
import { requireEmployeeWorkspaceAccess } from "@/lib/authz"

export default async function EmployeePage() {
  await requireEmployeeWorkspaceAccess()
  return <EmployeeDashboard />
}
