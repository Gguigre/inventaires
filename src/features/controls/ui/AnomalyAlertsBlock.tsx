// Dépasse 120 lignes : regroupe les 3 sections d'alertes (anomalies, périmés, bientôt périmés)
// et leurs coquilles partagées (AlertRow, CorrectButton, ExpirySection) dans un seul bloc visuel.
"use client";

import type { ReactNode } from "react";
import type { ExpiryAlertItem, AnomalyAlertItem } from "../domain/types";
import { formatDate } from "@/shared/lib/format";

interface AnomalyAlertsBlockProps {
  anomalies: AnomalyAlertItem[];
  expired: ExpiryAlertItem[];
  atRisk: ExpiryAlertItem[];
  onCorrect: (item: ExpiryAlertItem) => void;
  onCorrectAnomaly: (item: AnomalyAlertItem) => void;
}

function AlertRow({
  itemName,
  inventoryName,
  compartmentName,
  comment,
  trailing,
}: {
  itemName: string;
  inventoryName: string;
  compartmentName: string;
  comment: string | null;
  trailing: ReactNode;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {itemName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {inventoryName} · {compartmentName}
        </p>
        {comment && (
          <p className="text-xs text-amber-700 mt-0.5 truncate">{comment}</p>
        )}
      </div>
      {trailing}
    </li>
  );
}

function CorrectButton({ testId, onClick }: { testId: string; onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
    >
      Corriger
    </button>
  );
}

function ExpirySection({
  title,
  colorClass,
  items,
  onCorrect,
}: {
  title: string;
  colorClass: string;
  items: ExpiryAlertItem[];
  onCorrect: (item: ExpiryAlertItem) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="py-3">
      <p className={`text-xs font-bold ${colorClass} uppercase tracking-widest mb-2`}>
        {title} ({items.length})
      </p>
      <ul>
        {items.map((item) => (
          <AlertRow
            key={item.itemId}
            itemName={item.itemName}
            inventoryName={item.inventoryName}
            compartmentName={item.compartmentName}
            comment={item.comment}
            trailing={
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-500">{formatDate(item.latestExpiryDate)}</span>
                <CorrectButton testId={`btn-correct-${item.itemId}`} onClick={() => onCorrect(item)} />
              </div>
            }
          />
        ))}
      </ul>
    </div>
  );
}

export function AnomalyAlertsBlock({
  anomalies,
  expired,
  atRisk,
  onCorrect,
  onCorrectAnomaly,
}: AnomalyAlertsBlockProps) {
  const hasAlerts =
    anomalies.length > 0 || expired.length > 0 || atRisk.length > 0;

  if (!hasAlerts) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 mb-8 flex items-center gap-3">
        <span className="text-emerald-600 font-bold text-lg">✓</span>
        <p className="text-sm text-emerald-700 font-medium">
          Aucune anomalie ou alerte de péremption en cours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl mb-8 overflow-hidden">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
          Anomalies et alertes actives
        </h2>
      </div>
      <div className="px-5">
        {anomalies.length > 0 && (
          <div className="py-3">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              Anomalies ({anomalies.length})
            </p>
            <ul>
              {anomalies.map((item) => (
                <AlertRow
                  key={`${item.itemId}-${item.controlId}`}
                  itemName={item.itemName}
                  inventoryName={item.inventoryName}
                  compartmentName={item.compartmentName}
                  comment={item.comment}
                  trailing={
                    <CorrectButton
                      testId={`btn-correct-anomaly-${item.itemId}`}
                      onClick={() => onCorrectAnomaly(item)}
                    />
                  }
                />
              ))}
            </ul>
          </div>
        )}
        <ExpirySection title="Périmés" colorClass="text-red-600" items={expired} onCorrect={onCorrect} />
        <ExpirySection title="Bientôt périmés" colorClass="text-amber-600" items={atRisk} onCorrect={onCorrect} />
      </div>
    </div>
  );
}
