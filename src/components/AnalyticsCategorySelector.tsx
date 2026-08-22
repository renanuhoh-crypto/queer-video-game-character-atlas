"use client";

import { useRouter } from "next/navigation";
import { ANALYTICS_CATEGORY_GROUPS } from "@/lib/analyticsCategories";

export default function AnalyticsCategorySelector({
  current = "",
}: {
  current?: string;
}) {
  const router = useRouter();

  return (
    <label className="analytics-category-selector">
      <span>Explore a detailed category</span>
      <select
        value={current}
        onChange={(event) => {
          const slug = event.target.value;
          if (slug) router.push(`/analytics/${slug}`);
          else router.push("/analytics");
        }}
      >
        <option value="">Analytics overview</option>
        {ANALYTICS_CATEGORY_GROUPS.map(({ group, categories }) => (
          <optgroup key={group} label={group}>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.menuLabel}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
