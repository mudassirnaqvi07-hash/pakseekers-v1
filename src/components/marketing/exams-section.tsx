import Link from "next/link";
import { ArrowRight, Layers, BookOpen } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import type { Exam } from "@/types";

interface ExamsSectionProps {
  exams: Exam[];
}

export function ExamsSection({ exams }: ExamsSectionProps) {
  return (
    <section id="exams" className="py-16 md:py-24 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Badge variant="info" className="mb-2 font-semibold">
              Curriculum Catalog
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
              Standardized Entrance Examinations
            </h2>
            <p className="text-text-secondary mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
              Explore dedicated preparation modules strictly mapped to the official syllabi
              of Pakistan’s premier public and private universities.
            </p>
          </div>

          <Link href="/exams">
            <Button
              variant="outline"
              size="sm"
              className="font-semibold"
              leftIcon={<BookOpen className="w-4 h-4 text-primary" />}
            >
              Full Catalog ({exams.length})
            </Button>
          </Link>
        </div>

        {/* Exams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <Card
              key={exam.id}
              className="flex flex-col justify-between hover:border-primary/50 transition-all hover:shadow-md bg-surface"
            >
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="info" className="font-bold text-xs tracking-wider">
                      {exam.code}
                    </Badge>
                    <span className="text-xs text-text-secondary font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-text-secondary" />
                      {exam.totalSubjects} Subjects
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-text-primary leading-snug mb-2">
                    {exam.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary line-clamp-3 leading-relaxed mb-6">
                    {exam.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    href={`/exams/${exam.id}`}
                    className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex flex-row items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <span>Explore Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>

                  <Link href={`/exams/${exam.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
