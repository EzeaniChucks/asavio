"use client";

// app/dashboard/admin/marketing/page.tsx
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaEnvelope,
  FaUsers,
  FaHome,
  FaUserTie,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPaperPlane,
  FaEdit,
  FaEye,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import { ADMIN_PERMISSIONS as P } from "@/lib/adminPermissions";

// ── Audience options ────────────────────────────────────────────

type Audience =
  | "all"
  | "users"
  | "hosts"
  | "verified_hosts"
  | "unverified_hosts"
  | "guests_with_bookings";

const AUDIENCES: { value: Audience; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "all",
    label: "Everyone",
    desc: "All users and hosts (no admins)",
    icon: <FaUsers className="text-blue-500" />,
  },
  {
    value: "users",
    label: "Guests only",
    desc: "All registered guest accounts",
    icon: <FaUsers className="text-indigo-500" />,
  },
  {
    value: "guests_with_bookings",
    label: "Guests who've booked",
    desc: "Guests with at least one booking",
    icon: <FaHome className="text-purple-500" />,
  },
  {
    value: "hosts",
    label: "All hosts",
    desc: "Every host account regardless of KYC",
    icon: <FaUserTie className="text-emerald-500" />,
  },
  {
    value: "verified_hosts",
    label: "Verified hosts",
    desc: "Hosts with KYC approved",
    icon: <FaCheckCircle className="text-green-500" />,
  },
  {
    value: "unverified_hosts",
    label: "Unverified hosts",
    desc: "Hosts whose KYC is not yet approved",
    icon: <FaExclamationTriangle className="text-amber-500" />,
  },
];

// ── Campaign templates ──────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  category: "promotional" | "informational" | "host" | "retention";
  defaultAudience: Audience;
  subject: string;
  htmlBody: string;
}

const TEMPLATES: Template[] = [
  {
    id: "welcome_back",
    name: "Welcome back",
    category: "retention",
    defaultAudience: "users",
    subject: "We've missed you — explore what's new on Asavio",
    htmlBody: `<h2 style="margin-top:0">Welcome back, {{firstName}}! 👋</h2>
<p>It's been a while and we've been busy curating new premium shortlets and luxury vehicles just for you.</p>
<p>Explore our latest listings across Lagos, Abuja, Port Harcourt, and more — your next unforgettable stay is waiting.</p>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/properties" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Browse new listings →</a>`,
  },
  {
    id: "new_listings",
    name: "New properties live",
    category: "promotional",
    defaultAudience: "users",
    subject: "✨ New premium shortlets just dropped on Asavio",
    htmlBody: `<h2 style="margin-top:0">New listings, just for you</h2>
<p>Hi {{firstName}}, exciting new properties have just been listed on Asavio — and they're spectacular.</p>
<p>From luxury penthouses in Lagos Island to serene retreats in Abuja, our hosts have raised the bar.</p>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/properties" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">See new properties →</a>`,
  },
  {
    id: "promo_offer",
    name: "Special offer",
    category: "promotional",
    defaultAudience: "all",
    subject: "🎉 Exclusive offer — book your next stay on Asavio",
    htmlBody: `<h2 style="margin-top:0">A special offer just for you, {{firstName}}</h2>
<p>We're celebrating our growing community with an exclusive deal. Don't miss out on some of the best shortlet deals available right now.</p>
<p>Browse our curated selection and find your perfect stay — luxury has never been more accessible.</p>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/properties" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Browse offers →</a>`,
  },
  {
    id: "holiday_promo",
    name: "Holiday season",
    category: "promotional",
    defaultAudience: "users",
    subject: "🏖️ Plan your holiday stay — Asavio has you covered",
    htmlBody: `<h2 style="margin-top:0">Make your holiday unforgettable, {{firstName}}</h2>
<p>The holiday season is the perfect time to treat yourself to a premium shortlet experience. Whether it's a city break, a beach retreat, or a corporate stay — Asavio has the perfect space for you.</p>
<p>Book early to secure the best properties. Our most popular listings fill up fast!</p>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/properties" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Plan my stay →</a>`,
  },
  {
    id: "host_tips",
    name: "Host tips & best practices",
    category: "host",
    defaultAudience: "verified_hosts",
    subject: "5 tips to maximise your bookings on Asavio",
    htmlBody: `<h2 style="margin-top:0">Boost your bookings, {{firstName}} 🏠</h2>
<p>Here are our top 5 tips to help you get more bookings and earn more on Asavio:</p>
<ol style="padding-left:20px;line-height:1.8">
  <li><strong>Great photos sell:</strong> Listings with professional photos get up to 40% more bookings.</li>
  <li><strong>Complete your description:</strong> Guests book when they have enough detail to feel confident.</li>
  <li><strong>Set competitive pricing:</strong> Browse similar listings in your area and price accordingly.</li>
  <li><strong>Enable purpose pricing:</strong> Charge appropriately for parties, shoots, and events.</li>
  <li><strong>Respond quickly:</strong> Fast responses build trust and improve your ranking.</li>
</ol>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/host" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Go to my dashboard →</a>`,
  },
  {
    id: "kyc_reminder",
    name: "KYC verification reminder",
    category: "host",
    defaultAudience: "unverified_hosts",
    subject: "⚠️ Complete your identity verification to go live on Asavio",
    htmlBody: `<h2 style="margin-top:0">Your listings are hidden, {{firstName}}</h2>
<p>To protect our guests and hosts, Asavio requires all hosts to complete identity verification (KYC) before their listings can be discovered by guests.</p>
<p>It only takes a few minutes — simply upload a clear photo of one of these accepted documents:</p>
<ul style="padding-left:20px;line-height:1.8">
  <li>National ID Card</li>
  <li>Voter's Card</li>
  <li>Driver's License</li>
  <li>International Passport</li>
  <li>NIN Slip</li>
</ul>
<p>Once approved, your listings will be immediately visible to thousands of potential guests.</p>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/host/kyc" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Verify my identity →</a>`,
  },
  {
    id: "become_host",
    name: "Invite guests to become hosts",
    category: "retention",
    defaultAudience: "guests_with_bookings",
    subject: "Do you have a space to share? Become an Asavio host",
    htmlBody: `<h2 style="margin-top:0">Turn your space into income, {{firstName}} 💰</h2>
<p>You've experienced Asavio as a guest — now imagine earning from your own property or vehicle.</p>
<p>Thousands of travellers are looking for premium shortlets every day. If you have a property, spare apartment, or luxury vehicle, Asavio makes it easy to start earning.</p>
<ul style="padding-left:20px;line-height:1.8">
  <li>List your space in minutes</li>
  <li>Set your own prices and availability</li>
  <li>Get paid securely via Paystack</li>
  <li>We handle the platform — you host</li>
</ul>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}/register?role=host" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Start hosting →</a>`,
  },
  {
    id: "platform_update",
    name: "Platform / policy update",
    category: "informational",
    defaultAudience: "all",
    subject: "Important update to Asavio — please read",
    htmlBody: `<h2 style="margin-top:0">An important update from Asavio</h2>
<p>Hi {{firstName}}, we're writing to let you know about an important update to our platform.</p>
<p><strong>[Add your update content here.]</strong></p>
<p>If you have any questions, please don't hesitate to reach out to our support team.</p>
<a href="${typeof window !== "undefined" ? window.location.origin : ""}" class="btn" style="display:inline-block;background:#000;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Visit Asavio →</a>`,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  promotional: "Promotional",
  informational: "Informational",
  host: "For Hosts",
  retention: "Retention",
};

const CATEGORY_COLORS: Record<string, string> = {
  promotional: "bg-blue-100 text-blue-700",
  informational: "bg-gray-100 text-gray-700",
  host: "bg-emerald-100 text-emerald-700",
  retention: "bg-purple-100 text-purple-700",
};

// ── Component ───────────────────────────────────────────────────

type Step = "compose" | "preview" | "confirm";

export default function AdminMarketingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>("compose");

  // Form state
  const [audience, setAudience] = useState<Audience>("all");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  // Recipient count
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);

  // Send state
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Debounced recipient count fetch
  const fetchCount = useCallback(
    async (a: Audience) => {
      setIsCounting(true);
      try {
        const res = await api.get(`/admin/email/audience-count?audience=${a}`);
        setRecipientCount(res.data.data.count);
      } catch {
        setRecipientCount(null);
      } finally {
        setIsCounting(false);
      }
    },
    []
  );

  useEffect(() => {
    const timeout = setTimeout(() => fetchCount(audience), 300);
    return () => clearTimeout(timeout);
  }, [audience, fetchCount]);

  const applyTemplate = (t: Template) => {
    setActiveTemplate(t.id);
    setSubject(t.subject);
    setHtmlBody(t.htmlBody);
    setAudience(t.defaultAudience);
  };

  const handleSend = async () => {
    if (!subject.trim() || !htmlBody.trim()) {
      return toast.error("Subject and body are required");
    }
    setIsSending(true);
    try {
      const res = await api.post("/admin/email/broadcast", {
        audience,
        subject: subject.trim(),
        htmlBody: htmlBody.trim(),
      });
      toast.success(`Campaign sent to ${res.data.data.sent} recipients`);
      // Reset
      setStep("compose");
      setSubject("");
      setHtmlBody("");
      setActiveTemplate(null);
      setAudience("all");
    } catch {
      // interceptor handles toast
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  const selectedAudience = AUDIENCES.find((a) => a.value === audience)!;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/admin"
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Email Marketing</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Send targeted campaigns to guests, hosts, or the whole Asavio community.
            </p>
          </div>
        </div>

        {/* Mobile-only: compact template picker */}
        <div className="lg:hidden mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Campaign template
          </label>
          <div className="flex items-center gap-2">
            <select
              value={activeTemplate ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setActiveTemplate(null);
                  setSubject("");
                  setHtmlBody("");
                } else {
                  const t = TEMPLATES.find((t) => t.id === val);
                  if (t) applyTemplate(t);
                }
              }}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">— Start blank —</option>
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({CATEGORY_LABELS[t.category]})
                </option>
              ))}
            </select>
          </div>
          {activeTemplate && (() => {
            const t = TEMPLATES.find((t) => t.id === activeTemplate)!;
            return (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${CATEGORY_COLORS[t.category]}`}>
                  {CATEGORY_LABELS[t.category]}
                </span>
                <span className="text-xs text-gray-700 font-medium truncate">{t.name}</span>
                <span className="text-xs text-gray-400">
                  · Default: {AUDIENCES.find((a) => a.value === t.defaultAudience)?.label}
                </span>
                <button
                  onClick={() => { setActiveTemplate(null); setSubject(""); setHtmlBody(""); }}
                  className="text-gray-400 hover:text-black transition-colors ml-auto"
                  aria-label="Clear template"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            );
          })()}
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Left — Templates (desktop only) */}
          <div className="hidden lg:block space-y-4">
            <h2 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Campaign templates
            </h2>
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                    activeTemplate === t.id
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`font-medium text-sm ${activeTemplate === t.id ? "text-white" : "text-gray-900"}`}>
                      {t.name}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        activeTemplate === t.id
                          ? "bg-white/20 text-white"
                          : CATEGORY_COLORS[t.category]
                      }`}
                    >
                      {CATEGORY_LABELS[t.category]}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${activeTemplate === t.id ? "text-white/70" : "text-gray-500"}`}>
                    Default: {AUDIENCES.find((a) => a.value === t.defaultAudience)?.label}
                  </p>
                </button>
              ))}
            </div>

            {/* Blank campaign */}
            <button
              onClick={() => {
                setActiveTemplate(null);
                setSubject("");
                setHtmlBody("");
              }}
              className="w-full text-center py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-500 hover:text-gray-700 transition-colors"
            >
              + Start blank campaign
            </button>
          </div>

          {/* Right — Composer / Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Step switcher */}
            <div className="flex border-b border-gray-100">
              {(["compose", "preview"] as Step[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    step === s
                      ? "border-black text-black"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {s === "compose" ? <FaEdit className="text-xs" /> : <FaEye className="text-xs" />}
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {step === "compose" && (
              <div className="p-6 space-y-5">
                {/* Audience selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audience
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {AUDIENCES.map((a) => (
                      <button
                        key={a.value}
                        onClick={() => setAudience(a.value)}
                        className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                          audience === a.value
                            ? "border-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                      >
                        <span className="text-base">{a.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.label}</p>
                          <p className="text-xs text-gray-500 truncate">{a.desc}</p>
                        </div>
                        {audience === a.value && (
                          <FaCheckCircle className="text-black ml-auto flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Live recipient count */}
                  <div className="mt-2 flex items-center gap-1.5 text-sm">
                    {isCounting ? (
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                        Counting…
                      </span>
                    ) : recipientCount !== null ? (
                      <span className="text-gray-600">
                        <strong className="text-gray-900">{recipientCount.toLocaleString()}</strong>{" "}
                        {recipientCount === 1 ? "recipient" : "recipients"} will receive this campaign
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject line
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Exciting news from Asavio…"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <p className="text-xs text-gray-400 mt-1">{subject.length}/100 characters</p>
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email body{" "}
                    <span className="text-gray-400 font-normal">(HTML supported · use {"{{firstName}}"} to personalise)</span>
                  </label>
                  <textarea
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    placeholder="<h2>Hi {{firstName}}</h2><p>Your message here…</p>"
                    rows={12}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setStep("preview")}
                    disabled={!subject.trim() || !htmlBody.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaEye className="text-xs" />
                    Preview email
                  </button>
                  <button
                    onClick={() => {
                      if (!subject.trim() || !htmlBody.trim()) {
                        return toast.error("Subject and body are required");
                      }
                      setStep("confirm");
                    }}
                    disabled={!subject.trim() || !htmlBody.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaPaperPlane className="text-xs" />
                    Send campaign
                  </button>
                </div>
              </div>
            )}

            {step === "preview" && (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Subject</p>
                    <p className="font-semibold text-gray-900">{subject || "—"}</p>
                  </div>
                  <button
                    onClick={() => setStep("compose")}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                </div>

                {/* Email preview iframe-like */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 text-xs text-gray-500 border-b border-gray-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="ml-2">Email preview — {"{{firstName}}"} shown as &quot;Alex&quot;</span>
                  </div>
                  <div className="bg-gray-50 p-4">
                    <div className="max-w-lg mx-auto">
                      {/* Brand header */}
                      <div className="bg-black text-yellow-400 px-8 py-6 rounded-t-xl font-bold text-xl tracking-tight">
                        Asavio
                      </div>
                      <div
                        className="bg-white px-8 py-8 text-sm text-gray-700 leading-relaxed rounded-b-xl border border-t-0 border-gray-200"
                        dangerouslySetInnerHTML={{
                          __html: htmlBody.replace(/\{\{firstName\}\}/g, "Alex"),
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setStep("compose")}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <FaPaperPlane className="text-xs" />
                    Send campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm / send modal */}
      {step === "confirm" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Confirm campaign send</h2>
              <button
                onClick={() => setStep("compose")}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Audience</span>
                <span className="font-medium text-gray-900">{selectedAudience.label}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Recipients</span>
                <span className="font-bold text-gray-900">
                  {isCounting ? "…" : recipientCount !== null ? recipientCount.toLocaleString() : "—"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Subject</span>
                <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{subject}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800">
              This action will immediately send an email to all{" "}
              <strong>{recipientCount !== null ? recipientCount.toLocaleString() : "—"}</strong> recipients. This cannot be undone.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("compose")}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <FaPaperPlane className="text-xs" />
                {isSending ? "Sending…" : "Send now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminPageGuard>
  );
}
