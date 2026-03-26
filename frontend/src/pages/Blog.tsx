import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const posts = [
  {
    id: "1",
    slug: "clean-architecture-platform",
    title: "Designing an AI Tool Platform with Clean Architecture",
    summary: "How router/service/repository boundaries keep backend modules easy to scale.",
    tag: "Architecture",
  },
  {
    id: "2",
    slug: "token-usage-billing",
    title: "Tracking Token Usage for Real SaaS Billing",
    summary: "A practical usage-log strategy for quotas, analytics, and future billing integration.",
    tag: "Backend",
  },
  {
    id: "3",
    slug: "feature-flags-admin-releases",
    title: "Feature Flags for Safer Admin Releases",
    summary: "Why staged rollouts matter and how admins can gate risky capabilities.",
    tag: "Operations",
  },
];

export default function Blog() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Engineering Blog</h1>
          <p className="mt-3 text-muted-foreground">Product updates and technical write-ups from the build.</p>
        </div>

        <div className="grid gap-4 max-w-4xl mx-auto">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card className="border-transparent card-elevated hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <Badge variant="secondary" className="w-fit">{post.tag}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{post.summary}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
