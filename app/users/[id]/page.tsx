"use client";

// app/users/[id]/page.tsx — admin view of any user's profile
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaPhone,
  FaEnvelope,
  FaUserShield,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaTimes,
  FaPaperPlane,
} from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { User } from "@/types";
import toast from "react-hot-toast";

const KYC_BADGE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-600",
  not_submitted: "bg-gray-100 text-gray-500",
};

const TIER_BADGE: Record<string, string> = {
  new_host: "bg-gray-100 text-gray-600",
  trusted_host: "bg-blue-100 text-blue-700",
  top_host: "bg-amber-100 text-amber-700",
};

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Email compose modal
  const [showEmail, setShowEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (authUser?.role !== "admin") { router.push("/"); return; }
  }, [authLoading, isAuthenticated, authUser, router]);

  useEffect(() => {
    if (!authUser || authUser.role !== "admin" || !id) return;
    setIsLoading(true);
    api
      .get(`/admin/users/${id}`)
      .then((res) => setProfile(res.data.data.user))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setIsLoading(false));
  }, [authUser, id]);

  async function sendEmail() {
    if (!profile || !emailSubject.trim() || !emailMessage.trim()) return;
    setEmailSending(true);
    try {
      await api.post("/admin/email/direct", {
        userId: profile.id,
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      });
      toast.success(`Email sent to ${profile.firstName}`);
      setShowEmail(false);
      setEmailSubject("");
      setEmailMessage("");
    } catch {
      // interceptor handles toast
    } finally {
      setEmailSending(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-500 text-sm">User not found.</p>
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-black underline"
        >
          Back to users
        </Link>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-sm" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">User Profile</h1>
            <p className="text-xs text-gray-400 mt-0.5">Admin view</p>
          </div>
        </div>

        {/* Identity card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex items-start gap-4">
            {profile.profileImage ? (
              <Image
                src={profile.profileImage}
                alt={`${profile.firstName} ${profile.lastName}`}
                width={64}
                height={64}
                className="rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h2>
                {profile.isVerified && (
                  <FaCheckCircle
                    className="text-blue-500 flex-shrink-0"
                    title="Verified"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    profile.role === "host"
                      ? "bg-blue-100 text-blue-700"
                      : profile.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {profile.role}
                </span>
                {profile.role === "host" && profile.hostTier && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      TIER_BADGE[profile.hostTier] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {profile.hostTier.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <FaCalendarAlt className="text-gray-300" />
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Contact Information
          </h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 text-sm">
              <FaEnvelope className="text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 break-all">{profile.email}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3 text-sm">
                <FaPhone className="text-gray-400 flex-shrink-0" />
                <a
                  href={`tel:${profile.phone}`}
                  className="text-gray-700 hover:text-black transition"
                >
                  {profile.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Account details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Account Details
          </h3>
          <div className="grid grid-cols-2 gap-y-4 gap-x-6">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Email verified</p>
              <p className="text-sm font-medium text-gray-900">
                {profile.isEmailVerified ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Account verified</p>
              <p className="text-sm font-medium text-gray-900">
                {profile.isVerified ? "Yes" : "No"}
              </p>
            </div>
            {profile.role === "host" && (
              <>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">KYC status</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                      KYC_BADGE[profile.kycStatus ?? "not_submitted"]
                    }`}
                  >
                    {profile.kycStatus?.replace(/_/g, " ") ?? "Not submitted"}
                  </span>
                </div>
                {profile.responseRate != null && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Response rate</p>
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round(Number(profile.responseRate) * 100)}%
                    </p>
                  </div>
                )}
                {profile.subscriptionTier && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Subscription</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {profile.subscriptionTier}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/dashboard/admin/users?search=${encodeURIComponent(profile.email)}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            <FaUserShield className="text-xs" />
            Manage in admin
          </Link>

          <button
            onClick={() => { setShowEmail(true); setEmailSubject(""); setEmailMessage(""); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition"
          >
            <FaEnvelope className="text-xs" />
            Send email
          </button>

          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition"
            >
              <FaPhone className="text-xs" />
              Call
            </a>
          )}

          {profile.role === "host" && (
            <Link
              href={`/hosts/${profile.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <FaExternalLinkAlt className="text-xs" />
              Public profile
            </Link>
          )}
        </div>
      </div>

      {/* Email compose modal */}
      {showEmail && profile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                Email {profile.firstName}
              </h3>
              <button
                onClick={() => setShowEmail(false)}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">To: {profile.email}</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
              />
              <textarea
                placeholder="Message…"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowEmail(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                disabled={emailSending || !emailSubject.trim() || !emailMessage.trim()}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
              >
                <FaPaperPlane className="text-xs" />
                {emailSending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
