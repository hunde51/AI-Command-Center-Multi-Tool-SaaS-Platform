import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const postContent: Record<string, { title: string; tag: string; body: string[] }> = {
  "clean-architecture-platform": {
    title: "Designing an AI Tool Platform with Clean Architecture",
    tag: "Architecture",
    body: [
      "The platform uses clear separation between API routers, services, and repositories.",
      "This keeps domain logic testable and lets us evolve data storage without breaking endpoints.",
      "The result is a backend that is easier to scale and safer to change as features grow.",
    ],
  },
  "token-usage-billing": {
    title: "Tracking Token Usage for Real SaaS Billing",
    tag: "Backend",
    body: [
      "Usage tracking captures tokens, model selection, and per-action cost estimates.",
      "These events power quota enforcement, analytics dashboards, and future invoicing.",
      "A consistent event model avoids drift between product metrics and billing records.",
    ],
  },
  "feature-flags-admin-releases": {
    title: "Feature Flags for Safer Admin Releases",
    tag: "Operations",
    body: [
      "Feature flags let admins stage rollouts and disable risky capabilities instantly.",
      "This reduces blast radius during deployment and supports controlled experiments.",
      "Auditable flag changes also improve operational transparency for teams.",
    ],
  },
};

export default function BlogPost() {
  const { slug } = useParams();
  const post = slug ? postContent[slug] : undefined;

  if (!post) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h1 className="font-display text-3xl font-bold text-foreground">Post not found</h1>
          <p className="mt-3 text-muted-foreground">The blog article you requested does not exist.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/blog" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <article className="container mx-auto px-4 max-w-3xl">
        <Button asChild variant="ghost" className="mb-6 -ml-3">
          <Link to="/blog" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </Button>
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">{post.tag}</p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-2">{post.title}</h1>
        <div className="mt-6 space-y-4 text-muted-foreground leading-7">
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
