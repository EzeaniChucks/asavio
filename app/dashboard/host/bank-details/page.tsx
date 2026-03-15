"use client";

// app/dashboard/host/bank-details/page.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaUniversity, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface Bank {
  name: string;
  code: string;
}

interface BankDetails {
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankCode: string | null;
  bankName: string | null;
  hasDetails: boolean;
}

export default function BankDetailsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [banks, setBanks] = useState<Bank[]>([]);
  const [current, setCurrent] = useState<BankDetails | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);

  const [bankCode, setBankCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [verifiedName, setVerifiedName] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  // Load banks list and current bank details
  useEffect(() => {
    if (!user) return;
    api
      .get("/payouts/banks")
      .then((res) => setBanks(res.data.data.banks))
      .catch(() => toast.error("Could not load bank list"));

    api
      .get("/payouts/my-bank")
      .then((res) => setCurrent(res.data.data))
      .catch(() => {})
      .finally(() => setLoadingCurrent(false));
  }, [user]);

  // Auto-verify when account number is 10 digits and a bank is selected
  useEffect(() => {
    setVerifiedName("");
    if (accountNumber.length !== 10 || !bankCode) return;

    setIsVerifying(true);
    api
      .get(`/payouts/verify-account?accountNumber=${accountNumber}&bankCode=${bankCode}`)
      .then((res) => setVerifiedName(res.data.data.accountName))
      .catch(() => toast.error("Could not verify account. Check the details and try again."))
      .finally(() => setIsVerifying(false));
  }, [accountNumber, bankCode]);

  const handleBankChange = (code: string) => {
    setBankCode(code);
    const found = banks.find((b) => b.code === code);
    setBankName(found?.name ?? "");
    setVerifiedName("");
  };

  const handleSave = async () => {
    if (!verifiedName) {
      toast.error("Please verify your account number first");
      return;
    }
    setIsSaving(true);
    try {
      await api.post("/payouts/my-bank", { accountNumber, bankCode, bankName });
      toast.success("Bank details saved successfully");
      // Refresh current
      const res = await api.get("/payouts/my-bank");
      setCurrent(res.data.data);
      setBankCode("");
      setBankName("");
      setAccountNumber("");
      setVerifiedName("");
    } catch {
      // interceptor shows toast
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loadingCurrent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payout bank details</h1>
        <p className="text-gray-500 text-sm mb-8">
          Add your Nigerian bank account to receive payouts after guests check in.
        </p>

        {/* Current details */}
        {current?.hasDetails && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex gap-3">
            <FaCheckCircle className="text-green-500 text-xl shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800">Bank account on file</p>
              <p className="text-sm text-green-700 mt-1">
                {current.bankName} — {current.bankAccountNumber}
              </p>
              <p className="text-sm text-green-700">{current.bankAccountName}</p>
            </div>
          </div>
        )}

        {/* Warning */}
        <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-800">
          <FaExclamationTriangle className="shrink-0 mt-0.5 text-amber-500" />
          <p>
            Only Nigerian bank accounts (NUBAN) are supported. Payouts are initiated by Asavio
            admin after guest check-in. Make sure your account details are correct — we cannot
            reverse failed transfers.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FaUniversity className="text-gray-400" />
            {current?.hasDetails ? "Update bank account" : "Add bank account"}
          </h2>

          {/* Bank selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank</label>
            <select
              value={bankCode}
              onChange={(e) => handleBankChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black bg-white"
            >
              <option value="">Select your bank…</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account number
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit account number"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
            />
            {isVerifying && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                Verifying account…
              </p>
            )}
            {verifiedName && !isVerifying && (
              <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1.5">
                <FaCheckCircle />
                {verifiedName}
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!verifiedName || isSaving}
            className="w-full bg-black text-white font-semibold py-3 rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving…" : "Save bank details"}
          </button>
        </div>
      </div>
    </div>
  );
}
