import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AnalyticsCategoryDetail from "@/components/AnalyticsCategoryDetail";
import AnalyticsCategoryHero from "@/components/AnalyticsCategoryHero";
import {
  ANALYTICS_CATEGORIES,
  getAnalyticsCategory,
} from "@/lib/analyticsCategories";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return ANALYTICS_CATEGORIES.map((category) => ({
    category: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getAnalyticsCategory(slug);
  if (!category) return {};

  return {
    title: `${category.title} analytics`,
    description: category.summary,
  };
}

export default async function AnalyticsCategoryPage({ params }: CategoryPageProps) {
  const { category: slug } = await params;
  const category = getAnalyticsCategory(slug);
  if (!category) notFound();

  return (
    <main className="pq-page min-h-screen bg-[#f7f7fb] text-[#12152b]">
      <AnalyticsCategoryHero category={category} />
      <AnalyticsCategoryDetail slug={category.slug} />
    </main>
  );
}
