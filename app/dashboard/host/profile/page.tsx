"use client";

// app/dashboard/host/profile/page.tsx
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaCamera,
  FaPlus,
  FaTimes,
  FaExternalLinkAlt,
  FaUser,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const COMPLETENESS_WEIGHTS: Record<string, number> = {
  profileImage: 20,
  bio: 20,
  languages: 15,
  whyIHost: 15,
  occupation: 10,
  city: 10,
  school: 10,
};

function calcCompleteness(fields: {
  profileImage?: string;
  bio?: string;
  languages?: string[];
  whyIHost?: string;
  occupation?: string;
  city?: string;
  school?: string;
}): number {
  let score = 0;
  if (fields.profileImage) score += COMPLETENESS_WEIGHTS.profileImage;
  if (fields.bio?.trim()) score += COMPLETENESS_WEIGHTS.bio;
  if (fields.languages && fields.languages.length > 0) score += COMPLETENESS_WEIGHTS.languages;
  if (fields.whyIHost?.trim()) score += COMPLETENESS_WEIGHTS.whyIHost;
  if (fields.occupation?.trim()) score += COMPLETENESS_WEIGHTS.occupation;
  if (fields.city?.trim()) score += COMPLETENESS_WEIGHTS.city;
  if (fields.school?.trim()) score += COMPLETENESS_WEIGHTS.school;
  return score;
}

export default function HostProfileEditPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = useState<string>("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState("");
  const [occupation, setOccupation] = useState("");
  const [city, setCity] = useState("");
  const [school, setSchool] = useState("");
  const [whyIHost, setWhyIHost] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.role !== "host" && user?.role !== "admin"))) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    api
      .get("/auth/me")
      .then((res) => {
        const u = res.data?.data?.user ?? res.data?.user ?? res.data;
        setProfileImage(u.profileImage ?? "");
        setBio(u.bio ?? "");
        setLanguages(Array.isArray(u.languages) ? u.languages : []);
        setOccupation(u.occupation ?? "");
        setCity(u.city ?? "");
        setSchool(u.school ?? "");
        setWhyIHost(u.whyIHost ?? "");
      })
      .catch(() => {
        // Fall back to user from context
        if (user) {
          const u = user as Record<string, unknown>;
          setProfileImage((u.profileImage as string) ?? "");
          setBio((u.bio as string) ?? "");
          setLanguages(Array.isArray(u.languages) ? (u.languages as string[]) : []);
          setOccupation((u.occupation as string) ?? "");
          setCity((u.city as string) ?? "");
          setSchool((u.school as string) ?? "");
          setWhyIHost((u.whyIHost as string) ?? "");
        }
      })
      .finally(() => setIsLoadingProfile(false));
  }, [user]);

  const completeness = calcCompleteness({
    profileImage,
    bio,
    languages,
    whyIHost,
    occupation,
    city,
    school,
  });

  // Photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("photo", file);
    setIsUploading(true);
    try {
      const res = await api.post("/users/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newUrl = res.data?.data?.profileImage ?? res.data?.profileImage ?? "";
      setProfileImage(newUrl);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Language tag input
  const addLanguage = () => {
    const trimmed = langInput.trim();
    if (!trimmed) return;
    if (languages.map((l) => l.toLowerCase()).includes(trimmed.toLowerCase())) {
      setLangInput("");
      return;
    }
    setLanguages((prev) => [...prev, trimmed]);
    setLangInput("");
  };

  const removeLanguage = (index: number) => {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLangKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLanguage();
    }
  };

  // Save profile
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.patch("/users/profile", {
        bio,
        languages,
        occupation,
        city,
        whyIHost,
        school,
      });
      toast.success("Profile saved successfully");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    user
      ? `${(user as Record<string, unknown>).firstName as string ?? ""}${
          (user as Record<string, unknown>).lastName as string ?? ""
        }`
          .slice(0, 2)
          .toUpperCase()
      : "?";

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit your profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Help guests get to know you better
            </p>
          </div>
          {user && (
            <a
              href={`/hosts/${(user as Record<string, unknown>).id as string}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-sm font-medium transition-colors"
            >
              View public profile
              <FaExternalLinkAlt className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Completeness bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Profile completeness</span>
            <span className="text-sm font-bold text-rose-600">{completeness}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 ? (
            <p className="text-xs text-gray-500">
              Complete your profile to build trust with guests
            </p>
          ) : (
            <p className="text-xs text-green-600 font-medium">
              Great job! Your profile is complete 🎉
            </p>
          )}
        </div>

        {/* Profile photo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Profile photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              {profileImage ? (
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-rose-100">
                  <Image
                    src={profileImage}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center ring-2 ring-rose-50">
                  {initials ? (
                    <span className="text-xl font-bold text-rose-600">{initials}</span>
                  ) : (
                    <FaUser className="w-7 h-7 text-rose-400" />
                  )}
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FaCamera className="w-4 h-4" />
                {isUploading ? "Uploading…" : "Upload photo"}
              </button>
              <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP. Max 5 MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="block text-base font-semibold text-gray-800 mb-1">
            Bio
          </label>
          <p className="text-xs text-gray-400 mb-3">Tell guests a little about yourself</p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            rows={4}
            placeholder="I love hosting and making guests feel at home…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/500</p>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="block text-base font-semibold text-gray-800 mb-1">
            Languages
          </label>
          <p className="text-xs text-gray-400 mb-3">Languages you speak</p>

          {languages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {languages.map((lang, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-medium px-3 py-1.5 rounded-full"
                >
                  {lang}
                  <button
                    onClick={() => removeLanguage(i)}
                    className="hover:text-rose-900 transition-colors"
                    aria-label={`Remove ${lang}`}
                  >
                    <FaTimes className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={langInput}
              onChange={(e) => setLangInput(e.target.value)}
              onKeyDown={handleLangKeyDown}
              placeholder="e.g. English, Yoruba…"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <button
              onClick={addLanguage}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-500 text-white text-sm font-medium rounded-xl hover:bg-rose-600 transition-colors"
            >
              <FaPlus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        {/* Occupation / City / School */}
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-800">More about you</h2>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Occupation
            </label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Software Engineer, Teacher…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Based in
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lagos, Abuja…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>

          {/* School */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Went to school at
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. University of Lagos…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>

        {/* Why I host */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="block text-base font-semibold text-gray-800 mb-1">
            Why I host
          </label>
          <p className="text-xs text-gray-400 mb-3">Share your motivation for hosting</p>
          <textarea
            value={whyIHost}
            onChange={(e) => setWhyIHost(e.target.value.slice(0, 300))}
            rows={3}
            placeholder="I host because I love meeting people from all over…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{whyIHost.length}/300</p>
        </div>

        {/* Save button */}
        <div className="pb-6">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-2xl transition-colors disabled:opacity-60 text-sm"
          >
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
