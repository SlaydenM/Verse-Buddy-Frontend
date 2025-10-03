import { MainLayout } from "@/components/layouts/main-layout"
import { Study } from "@/components/study/study"

interface StudyPageProps {
  searchParams: {
    referenceId?: string,
    quizType?: string
  }
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
  return (
    <MainLayout>
      <Study searchParams={await searchParams} />
    </MainLayout>
  )
}
