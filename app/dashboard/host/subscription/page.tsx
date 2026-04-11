"use client";

// app/dashboard/host/subscription/page.tsx
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { FaCheck, FaTimes, FaCrown, FaBolt } from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Subscription, SubscriptionTier, TierConfig, BillingCycle } from "@/types";
import { formatPrice } from "@/lib/formatPrice";

const TIER_ORDER: SubscriptionTier[] = ["starter", "pro", "elite"];

function FeatureRow({ label, starter, pro, elite }: { label: string; starter: React.ReactNode; pro: React.ReactNode; elite: React.ReactNode }) {
  return (
    <tr className="border-b border-gray-50">
      <td className="py-3 px-4 text-sm text-gray-600">{label}</td>
      <td className="py-3 px-4 text-center text-sm">{starter}</td>
      <td className="py-3 px-4 text-center text-sm bg-blue-50/40">{pro}</td>
      <td className="py-3 px-4 text-center text-sm bg-amber-50/40">{elite}</td>
    </tr>
  );
}

function CheckIcon({ yes }: { yes: boolean }) {
  return yes
    ? <FaCheck className="inline text-green-500" />
    : <FaTimes className="inline text-gray-300" />;
}

function SubscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>("starter");
  const [tierConfig, setTierConfig] = useState<Record<SubscriptionTier, TierConfig> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>("monthly");
  const [initiating, setInitiating] = useState<SubscriptionTier | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    // Paystack redirects back with ?success=1&reference=SUB-xxx&trxref=SUB-xxx
    if (searchParams.get("success") !== "1") return;

    const reference = searchParams.get("reference") || searchParams.get("trxref");

    // Clean the URL immediately so a page refresh doesn't re-trigger verification
    router.replace("/dashboard/host/subscription");

    if (!reference) {
      // No reference — can only happen if Paystack behaviour changes; show generic message
      toast.success("Payment received. Your subscription will activate shortly.");
      return;
    }

    // Verify with Paystack and activate if the webhook hasn't already fired
    api
      .post("/subscriptions/verify", { reference })
      .then((res) => {
        const { alreadyActive } = res.data.data;
        toast.success(
          alreadyActive
            ? "Subscription already active — you're all set!"
            : "Subscription activated! Welcome to your new plan."
        );
        // Refresh subscription state
        return Promise.all([
          api.get("/subscriptions/me"),
          api.get("/subscriptions/tiers"),
        ]);
      })
      .then((results) => {
        if (!results) return;
        const [meRes, tiersRes] = results;
        setSubscription(meRes.data.data.subscription);
        setCurrentTier(meRes.data.data.currentTier ?? "starter");
        setTierConfig(tiersRes.data.data.tiers);
      })
      .catch(() => {
        // api interceptor shows the error toast; nothing else to do
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get("/subscriptions/me"),
      api.get("/subscriptions/tiers"),
    ])
      .then(([meRes, tiersRes]) => {
        setSubscription(meRes.data.data.subscription);
        setCurrentTier(meRes.data.data.currentTier ?? "starter");
        setTierConfig(tiersRes.data.data.tiers);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === "starter") return;
    setInitiating(tier);
    try {
      const res = await api.post("/subscriptions/initiate", { tier, billingCycle: selectedCycle });
      const { authorization_url } = res.data.data;
      window.location.href = authorization_url;
    } catch {
      setInitiating(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period.")) return;
    setCancelling(true);
    try {
      await api.delete("/subscriptions/cancel");
      toast.success("Subscription cancelled. You'll keep access until your period ends.");
      // Refresh
      const res = await api.get("/subscriptions/me");
      setSubscription(res.data.data.subscription);
    } catch {
      // error toast handled by api interceptor
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading || !tierConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tiers = TIER_ORDER;
  const isActive = (tier: SubscriptionTier) => currentTier === tier;
  const isCancelled = subscription?.status === "cancelled";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-10 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-500 mt-1">Manage your Asavio host plan</p>
        </div>

        {/* Current plan banner */}
        {subscription && currentTier !== "starter" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              currentTier === "elite"
                ? "bg-amber-50 border-amber-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                {currentTier === "elite" ? (
                  <FaCrown className="text-amber-500" />
                ) : (
                  <FaBolt className="text-blue-500" />
                )}
                <span className="font-semibold text-gray-900">
                  {tierConfig[currentTier].label} plan
                  {isCancelled ? " (cancels at period end)" : ""}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {isCancelled
                  ? `Access until ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")}`
                  : `Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString("en-GB")} · ${subscription.billingCycle}`}
              </p>
            </div>
            {!isCancelled && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {cancelling ? "Cancelling…" : "Cancel subscription"}
              </button>
            )}
          </motion.div>
        )}

        {/* Billing cycle toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-1 gap-1">
            {(["monthly", "annual"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setSelectedCycle(cycle)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCycle === cycle ? "bg-black text-white" : "text-gray-600 hover:text-black"
                }`}
              >
                {cycle === "monthly" ? "Monthly" : "Annual"}
                {cycle === "annual" && (
                  <span className="ml-1.5 text-xs text-green-600 font-semibold">2 months free</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier, i) => {
            const cfg = tierConfig[tier];
            const active = isActive(tier);
            const price = selectedCycle === "annual" ? cfg.priceAnnual / 12 : cfg.priceMonthly;
            const isElite = tier === "elite";

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-white rounded-2xl border-2 p-6 flex flex-col ${
                  isElite
                    ? "border-amber-400 shadow-lg shadow-amber-100"
                    : active
                    ? "border-black"
                    : "border-gray-100"
                }`}
              >
                {isElite && (
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-2">
                    Most popular
                  </div>
                )}
                <h2 className="text-lg font-bold text-gray-900 mb-1">{cfg.label}</h2>
                <div className="mb-4">
                  {cfg.priceMonthly === 0 ? (
                    <span className="text-3xl font-bold">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{formatPrice(price)}</span>
                      <span className="text-gray-400 text-sm"> / mo</span>
                      {selectedCycle === "annual" && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Billed {formatPrice(cfg.priceAnnual)} annually
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-2 text-sm mb-6 flex-1">
                  <li className="flex items-center gap-2 text-gray-600">
                    <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                    {cfg.maxProperties == null || cfg.maxProperties === Infinity ? "Unlimited" : `Up to ${cfg.maxProperties}`} property listings
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                    {cfg.maxVehicles == null || cfg.maxVehicles === Infinity ? "Unlimited" : `Up to ${cfg.maxVehicles}`} vehicle listings
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                    {cfg.maxPhotos} photos per listing
                  </li>
                  <li className={`flex items-center gap-2 ${cfg.featureVideo ? "text-gray-600" : "text-gray-300"}`}>
                    {cfg.featureVideo ? (
                      <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                    ) : (
                      <FaTimes className="text-gray-300 text-xs flex-shrink-0" />
                    )}
                    Feature video ({cfg.videoMaxSeconds > 0 ? `${cfg.videoMaxSeconds}s / ${cfg.videoMaxSizeMB}MB` : "not available"})
                  </li>
                  <li className="flex items-center gap-2 text-gray-600">
                    <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                    {Math.round(cfg.commissionRate * 100)}% platform commission
                  </li>
                  <li className={`flex items-center gap-2 ${cfg.homepageFeatured ? "text-gray-600" : "text-gray-300"}`}>
                    {cfg.homepageFeatured ? (
                      <FaCheck className="text-green-500 text-xs flex-shrink-0" />
                    ) : (
                      <FaTimes className="text-gray-300 text-xs flex-shrink-0" />
                    )}
                    Homepage featured placement
                  </li>
                </ul>

                {tier === "starter" ? (
                  <div className={`py-2.5 px-4 rounded-xl text-center text-sm font-semibold ${active ? "bg-gray-100 text-gray-500" : "bg-gray-50 text-gray-400"}`}>
                    {active ? "Current plan" : "Free forever"}
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(tier)}
                    disabled={active || initiating === tier || (isCancelled && currentTier === tier)}
                    className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? "bg-gray-100 text-gray-500 cursor-default"
                        : isElite
                        ? "bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                        : "bg-black hover:bg-gray-800 text-white disabled:opacity-50"
                    }`}
                  >
                    {initiating === tier
                      ? "Redirecting…"
                      : active
                      ? "Current plan"
                      : `Upgrade to ${cfg.label}`}
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison table — all values come from the API tier config */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Full feature comparison</h2>
          </div>
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left py-3 px-4 w-1/2">Feature</th>
                <th className="py-3 px-4 text-center">Starter</th>
                <th className="py-3 px-4 text-center bg-blue-50/40">Pro</th>
                <th className="py-3 px-4 text-center bg-amber-50/40">Elite</th>
              </tr>
            </thead>
            <tbody>
              <FeatureRow
                label="Property listings"
                starter={String(tierConfig.starter.maxProperties)}
                pro={String(tierConfig.pro.maxProperties ?? "Unlimited")}
                elite={tierConfig.elite.maxProperties == null ? "Unlimited" : String(tierConfig.elite.maxProperties)}
              />
              <FeatureRow
                label="Vehicle listings"
                starter={String(tierConfig.starter.maxVehicles)}
                pro={String(tierConfig.pro.maxVehicles ?? "Unlimited")}
                elite={tierConfig.elite.maxVehicles == null ? "Unlimited" : String(tierConfig.elite.maxVehicles)}
              />
              <FeatureRow
                label="Photos per listing"
                starter={String(tierConfig.starter.maxPhotos)}
                pro={String(tierConfig.pro.maxPhotos)}
                elite={String(tierConfig.elite.maxPhotos)}
              />
              <FeatureRow
                label="Platform commission"
                starter={`${Math.round(tierConfig.starter.commissionRate * 100)}%`}
                pro={`${Math.round(tierConfig.pro.commissionRate * 100)}%`}
                elite={`${Math.round(tierConfig.elite.commissionRate * 100)}%`}
              />
              <FeatureRow label="Feature video" starter={<CheckIcon yes={false} />} pro={<CheckIcon yes={tierConfig.pro.featureVideo} />} elite={<CheckIcon yes={tierConfig.elite.featureVideo} />} />
              <FeatureRow
                label="Max video length"
                starter="—"
                pro={tierConfig.pro.videoMaxSeconds > 0 ? `${tierConfig.pro.videoMaxSeconds}s` : "—"}
                elite={tierConfig.elite.videoMaxSeconds > 0 ? `${tierConfig.elite.videoMaxSeconds}s` : "—"}
              />
              <FeatureRow
                label="Max video size"
                starter="—"
                pro={tierConfig.pro.videoMaxSizeMB > 0 ? `${tierConfig.pro.videoMaxSizeMB} MB` : "—"}
                elite={tierConfig.elite.videoMaxSizeMB > 0 ? `${tierConfig.elite.videoMaxSizeMB} MB` : "—"}
              />
              <FeatureRow label="Search boost" starter={<CheckIcon yes={false} />} pro={<CheckIcon yes={tierConfig.pro.searchBoost > 0} />} elite={<CheckIcon yes={tierConfig.elite.searchBoost > 0} />} />
              <FeatureRow label="Homepage featured placement" starter={<CheckIcon yes={false} />} pro={<CheckIcon yes={tierConfig.pro.homepageFeatured} />} elite={<CheckIcon yes={tierConfig.elite.homepageFeatured} />} />
              <FeatureRow label="Analytics dashboard" starter={<CheckIcon yes={true} />} pro={<CheckIcon yes={true} />} elite={<CheckIcon yes={true} />} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}
