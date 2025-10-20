import { Suspense } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { VersesDashboard } from "@/components/dashboard/verses"
import { Loader2 } from "lucide-react"

export default function VersesPage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Loading...</span>
          </div>
        }
      >
        <VersesDashboard />
      </Suspense>
    </MainLayout>
  )
}
