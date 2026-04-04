"use client";

// app/dashboard/user/profile/page.tsx
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaCamera } from "react-icons/fa";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function UserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Photo
  const [photoUploading, setPhotoUploading] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword]     = useState("");
  const [newPassword, setNewPassword]             = useState("");
  const [confirmPassword, setConfirmPassword]     = useState("");
  const [savingPassword, setSavingPassword]       = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone ?? "");
  }, [user]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("profileImage", file);
      await api.post("/users/profile/photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await refreshUser();
      toast.success("Photo updated");
    } catch {
      // interceptor handles toast
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await api.patch("/auth/me", { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() });
      await refreshUser();
      toast.success("Profile updated");
    } catch {
      // interceptor handles toast
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      // interceptor handles toast
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/dashboard/user"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors"
        >
          <FaArrowLeft /> Back to dashboard
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">My profile</h1>

        {/* Photo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-secondary flex items-center justify-center text-black font-bold text-2xl">
                {user.profileImage ? (
                  <Image src={user.profileImage} alt={user.firstName} fill className="object-cover" />
                ) : (
                  user.firstName?.[0]?.toUpperCase()
                )}
              </div>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoUploading}
                className="absolute bottom-0 right-0 w-7 h-7 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 transition-colors"
                title="Change photo"
              >
                <FaCamera className="text-xs" />
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {photoUploading ? "Uploading…" : "Click the camera icon to upload a new photo."}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Personal information</h2>
          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                value={user.email}
                disabled
                className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingInfo}
                className="btn-primary disabled:opacity-50"
              >
                {savingInfo ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Account info — read-only */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Role</span>
              <span className="font-medium capitalize text-gray-900">{user.role}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Email verified</span>
              <span className={user.isEmailVerified ? "text-green-600 font-medium" : "text-red-500"}>
                {user.isEmailVerified ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Identity verified</span>
              <span className={user.isVerified ? "text-green-600 font-medium" : "text-gray-400"}>
                {user.isVerified ? "Yes" : "Not yet"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-900">
                {new Date(user.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={savingPassword}
                className="btn-primary disabled:opacity-50"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
