import BusinessOverviewShell from "@/app/components/business/business-overview-shell"
import { getUserDashboards } from "@/lib/business"

export default async function BusinessOverviewPage() {
  const shops = await getUserDashboards()

  return <BusinessOverviewShell shops={shops} />
}
