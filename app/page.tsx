import { MainLayout } from "@/components/layouts/main-layout"
import { StudiesDashboard } from "@/components/dashboard/studies"

export default function Home() {
  return (
    <MainLayout>
      <StudiesDashboard />
    </MainLayout>
  )
}
