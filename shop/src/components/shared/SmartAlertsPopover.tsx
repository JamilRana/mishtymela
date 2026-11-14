"use client";

import React, { useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Package,
  BookOpen,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
} from "lucide-react";
import { getSmartAlerts, SmartAlert } from "@/actions/alerts";
import { useHydratedLanguage } from "@/stores/language";
import Link from "next/link";

export function SmartAlertsPopover() {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"ALL" | "STOCK" | "DUE">("ALL");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getSmartAlerts();
      setAlerts(res.alerts);
      setTotalCount(res.totalCount);
      setCriticalCount(res.criticalCount);
    } catch (err) {
      // Ignore background fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer initial alerts fetch so the main page renders instantaneously
    const timer = setTimeout(() => {
      fetchAlerts();
    }, 3000);
    const interval = setInterval(fetchAlerts, 90000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen && alerts.length === 0) {
      fetchAlerts();
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (activeTab === "ALL") return true;
    return a.category === activeTab;
  });

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          className="relative p-2 rounded-xl bg-[var(--well)] hover:bg-[var(--hover)] border border-[var(--rule)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors outline-none focus:ring-2 focus:ring-[var(--accent)]"
          title={isBn ? "স্মার্ট সতর্কতা" : "Smart Alerts"}
          aria-label={isBn ? "স্মার্ট সতর্কতা" : "Smart Alerts"}
        >
          <Bell className="w-4 h-4" />
          {totalCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-white shadow-xs ${
                criticalCount > 0 ? "bg-rose-600 animate-pulse" : "bg-amber-500"
              }`}
            >
              {totalCount > 9 ? "9+" : totalCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0c0e18] p-4 shadow-2xl border border-[var(--rule-strong)] outline-none text-xs text-[var(--ink)]"
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)] mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-sm text-[var(--ink)]">
                  {isBn ? "স্মার্ট সতর্কতা" : "Smart Alerts"}
                </span>
                {totalCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-[var(--well)] border border-[var(--rule)] text-[10px] font-mono rounded font-semibold text-[var(--ink-2)]">
                    {totalCount}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--hover)] rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[var(--well)] rounded-xl border border-[var(--rule)] mb-3">
            {[
              { id: "ALL", label: isBn ? "সকল" : "All" },
              { id: "STOCK", label: isBn ? "স্টক" : "Stock" },
              { id: "DUE", label: isBn ? "বাকি" : "Dues" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#5b48f0] to-[#0a93c4] text-white shadow-xs"
                    : "text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="py-8 text-center text-[var(--ink-3)]">
                <CheckCircle2 className="w-7 h-7 mx-auto mb-1.5 text-emerald-500 opacity-80" />
                <p className="font-medium text-xs">
                  {isBn ? "সবকিছু স্বাভাবিক রয়েছে!" : "No active alerts. System healthy!"}
                </p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCritical = alert.urgency === "CRITICAL";

                return (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isCritical
                        ? "bg-rose-50/90 dark:bg-rose-950/50 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100"
                        : "bg-amber-50/90 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        {alert.category === "STOCK" ? (
                          <Package className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{isBn ? alert.titleBn : alert.title}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                          isCritical
                            ? "bg-rose-600 text-white"
                            : "bg-amber-600 text-white"
                        }`}
                      >
                        {alert.urgency}
                      </span>
                    </div>

                    <p className="text-[11px] opacity-90 leading-relaxed mb-2.5">
                      {isBn ? alert.messageBn : alert.message}
                    </p>

                    <Link
                      href={alert.actionUrl}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] hover:underline"
                    >
                      <span>{isBn ? alert.actionLabelBn : alert.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
