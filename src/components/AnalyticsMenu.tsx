import Link from "next/link";
import { ANALYTICS_CATEGORY_GROUPS } from "@/lib/analyticsCategories";

export default function AnalyticsMenu({ dark = false }: { dark?: boolean }) {
  return (
    <details className={`analytics-nav-menu ${dark ? "is-dark" : "is-light"}`}>
      <summary aria-label="Open analytics categories">
        Analytics <span aria-hidden="true">▾</span>
      </summary>
      <div className="analytics-nav-menu-panel">
        <Link href="/analytics" className="analytics-nav-overview-link">
          Analytics overview
        </Link>
        {ANALYTICS_CATEGORY_GROUPS.map(({ group, categories }) => (
          <div key={group} className="analytics-nav-menu-group">
            <p>{group}</p>
            {categories.map((category) => (
              <Link key={category.slug} href={`/analytics/${category.slug}`}>
                {category.menuLabel}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}
