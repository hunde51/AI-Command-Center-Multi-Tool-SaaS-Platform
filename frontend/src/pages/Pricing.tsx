import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicPricingPlans } from "@/services/backendApi";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Pricing() {
  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ["publicPricingPlans"],
    queryFn: fetchPublicPricingPlans,
  });

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Simple, transparent pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">Choose the plan that fits your workflow. Upgrade or downgrade at any time.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[450px] rounded-2xl" />)}
          </div>
        ) : plans?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 sm:p-8 border transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-card card-elevated border-primary/30 ring-1 ring-primary/20 sm:scale-[1.02]"
                    : "bg-card card-elevated border-transparent hover:border-primary/10"
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">Most Popular</span>
                )}
                <h3 className="font-display font-bold text-2xl text-card-foreground">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-bold text-card-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{plan.description}</p>
                <Button className="w-full mt-8" variant={plan.highlighted ? "default" : "outline"} size="lg" asChild>
                  <Link to="/login">{plan.cta}</Link>
                </Button>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-card-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-xl mx-auto rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isError ? "Pricing is temporarily unavailable. Please try again later." : "No pricing plans are configured yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
