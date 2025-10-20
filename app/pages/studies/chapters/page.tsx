import { Suspense } from "react"
import { MainLayout } from "@/components/layouts/main-layout"
import { ChaptersDashboard } from "@/components/dashboard/chapters"
import { Loader2 } from "lucide-react"

export default function ChaptersPage() {
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
        <ChaptersDashboard />
      </Suspense>
    </MainLayout>
  )
}
