"use client";

import React, { useState } from "react";
import {
  Sunrise,
  Sunset,
  ArrowLeftRight,
  Plus,
  RotateCcw,
  Building2,
  Smartphone,
  Banknote,
  Vault,
  User,
  ShieldCheck,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { MoneyText } from "@/components/shared/MoneyText";
import { OpenDayModal } from "./OpenDayModal";
import { TransferModal } from "./TransferModal";
import { CloseDayWizard } from "./CloseDayWizard";
import { prepareClosingAction, reopenLastDayAction } from "@/actions/treasury";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useHydratedLanguage } from "@/stores/language";

interface AccountData {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface TreasuryDailyCashTabProps {
  accounts: AccountData[];
  currentSession: {
    id: string;
    businessDate: string;
    openedAt: string;
    status: string;
    openedBy: { id: string; name: string; role: string };
    note?: string | null;
  } | null;
  lastClosedSession: {
    id: string;
    businessDate: string;
    closedAt: string | null;
    closedBy: { id: string; name: string; role: string } | null;
    approvedBy: { id: string; name: string; role: string } | null;
    closings: {
      accountId: string;
      accountName: string;
      countedBalance: number;
      variance: number;
      varianceReason?: string | null;
    }[];
  } | null;
  userRole?: string;
  onRefresh?: () => void;
  onOpenExpenseModal: () => void;
}

export const TreasuryDailyCashTab: React.FC<TreasuryDailyCashTabProps> = ({
  accounts,
  currentSession,
  lastClosedSession,
  userRole,
  onRefresh,
  onOpenExpenseModal,
}) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [isOpenDayOpen, setIsOpenDayOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCloseWizardOpen, setIsCloseWizardOpen] = useState(false);
  const [closingPrepData, setClosingPrepData] = useState<any | null>(null);
  const [isPrepLoading, setIsPrepLoading] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  const cashAccount = accounts.find((a) => a.type === "CASH");
  const previousCash = lastClosedSession?.closings?.find(
    (c) => c.accountId === cashAccount?.id
  )?.countedBalance ?? (cashAccount?.balance || 0);

  const isOwner = userRole === "OWNER" || userRole === "ADMIN";

  const handleStartClosing = async () => {
    setIsPrepLoading(true);
    try {
      const data = await prepareClosingAction();
      setClosingPrepData(data);
      setIsCloseWizardOpen(true);
    } catch (err: any) {
      alert(err?.message || "Failed to prepare daily closing.");
    } finally {
      setIsPrepLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!confirm(isBn ? "আপনি কি নিশ্চিতভাবে গতকালের ক্লোজ করা দিন পুনরায় খুলতে চান?" : "Are you sure you want to reopen the last closed session?")) {
      return;
    }
    setIsReopening(true);
    setReopenError(null);
    try {
      const res = await reopenLastDayAction();
      if (!res.success) {
        setReopenError(res.error);
        return;
      }
      onRefresh?.();
      window.location.reload();
    } catch (err: any) {
      setReopenError(err?.message || "Failed to reopen session");
    } finally {
      setIsReopening(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "CASH":
        return <Banknote className="w-5 h-5 text-emerald-600" />;
      case "BANK":
        return <Building2 className="w-5 h-5 text-blue-600" />;
      case "MOBILE":
        return <Smartphone className="w-5 h-5 text-rose-600" />;
      case "SAFE":
        return <Vault className="w-5 h-5 text-amber-600" />;
      case "OWNER":
        return <User className="w-5 h-5 text-purple-600" />;
      default:
        return <Banknote className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Status Hero Bar */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          currentSession
            ? "bg-gradient-to-r from-emerald-900/5 via-teal-900/5 to-slate-900/5 border-emerald-200"
            : "bg-gradient-to-r from-amber-900/5 via-orange-900/5 to-slate-900/5 border-amber-200"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                  currentSession ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {currentSession
                  ? isBn
                    ? "সক্রিয় ট্রেডিং সেশন চলমান"
                    : "Active Trading Session Open"
                  : isBn
                  ? "সেশন বন্ধ / খোলা হয়নি"
                  : "Session Closed / Not Opened"}
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-900">
              {currentSession ? (
                <>
                  {isBn ? "দিনের হিসাব খোলা হয়েছে: " : "Day Open since: "}
                  <span className="text-emerald-700">
                    {new Date(currentSession.openedAt).toLocaleTimeString("en-GB", {
                      timeZone: "Asia/Dhaka",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs font-normal text-slate-600 ml-2">
                    ({isBn ? "প্রস্তুতকারক:" : "Opened by:"} {currentSession.openedBy.name} • {currentSession.openedBy.role})
                  </span>
                </>
              ) : (
                <>
                  {lastClosedSession ? (
                    <>
                      {isBn ? "সর্বশেষ দিন সমাপ্ত: " : "Last Closed at: "}
                      {lastClosedSession.closedAt ? (
                        <span className="text-slate-700">
                          {new Date(lastClosedSession.closedAt).toLocaleDateString("en-GB", {
                            timeZone: "Asia/Dhaka",
                            day: "2-digit",
                            month: "short",
                          })}{" "}
                          {new Date(lastClosedSession.closedAt).toLocaleTimeString("en-GB", {
                            timeZone: "Asia/Dhaka",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    isBn ? "আজকের ট্রেডিং সেশন এখনও শুরু হয়নি" : "Trading day has not been opened yet"
                  )}
                </>
              )}
            </h2>

            {currentSession?.note && (
              <p className="text-xs text-slate-600 font-medium">
                {isBn ? "নোট: " : "Note: "} {currentSession.note}
              </p>
            )}

            {reopenError && (
              <p className="text-xs text-rose-600 font-bold">{reopenError}</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!currentSession ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsOpenDayOpen(true)}
                  className="h-10 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Sunrise className="w-4 h-4" />
                  <span>{isBn ? "দিন শুরু করুন (Open Day)" : "Open Trading Day"}</span>
                </button>

                {isOwner && lastClosedSession && (
                  <button
                    type="button"
                    disabled={isReopening}
                    onClick={handleReopen}
                    className="h-10 px-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isReopening ? (isBn ? "খুলছে..." : "Reopening...") : isBn ? "সর্বশেষ দিন পুনরায় খুলুন" : "Reopen Last Day"}</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                  <span>{isBn ? "ট্রান্সফার" : "Transfer"}</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenExpenseModal}
                  className="h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-rose-600" />
                  <span>{isBn ? "ব্যয় যুক্ত করুন" : "Add Expense"}</span>
                </button>

                <button
                  type="button"
                  disabled={isPrepLoading}
                  onClick={handleStartClosing}
                  className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Sunset className="w-4 h-4" />
                  <span>{isPrepLoading ? (isBn ? "হিসাব প্রস্তুত হচ্ছে..." : "Preparing...") : isBn ? "দিনের হিসাব সমাপ্ত করুন" : "Close Day"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Vault className="w-4 h-4 text-slate-600" />
            <span>{isBn ? "অ্যাকাউন্ট ব্যালেন্স ও তারল্য" : "Account Balances & Liquidity"}</span>
          </h3>
          <span className="text-xs text-slate-600">
            {isBn ? "মোট ব্যালেন্স:" : "Total Balance:"}{" "}
            <span className="font-bold text-slate-900 tabular-nums">
              ৳{isBn ? toBnDigits(accounts.reduce((sum, a) => sum + a.balance, 0).toFixed(2)) : accounts.reduce((sum, a) => sum + a.balance, 0).toFixed(2)}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      {acc.type}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTransferOpen(true)}
                  title={isBn ? "এই অ্যাকাউন্ট থেকে ট্রান্সফার" : "Transfer from this account"}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-600 font-medium">
                  {isBn ? "বর্তমান স্থিতি:" : "Current Balance:"}
                </span>
                <span className="text-lg font-black text-slate-900 tabular-nums">
                  ৳{isBn ? toBnDigits(acc.balance.toFixed(2)) : acc.balance.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Day Modal */}
      <OpenDayModal
        isOpen={isOpenDayOpen}
        onClose={() => setIsOpenDayOpen(false)}
        previousCash={previousCash}
        accounts={accounts}
        onSuccess={() => {
          onRefresh?.();
          window.location.reload();
        }}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts}
        onSuccess={() => {
          onRefresh?.();
          window.location.reload();
        }}
      />

      {/* Close Day Wizard */}
      {closingPrepData && (
        <CloseDayWizard
          isOpen={isCloseWizardOpen}
          onClose={() => setIsCloseWizardOpen(false)}
          prepData={closingPrepData}
          currentUserId={currentSession?.openedBy.id || ""}
          onSuccess={() => {
            onRefresh?.();
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};
