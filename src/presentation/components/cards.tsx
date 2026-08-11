import { ArrowRight, Users, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/domain/format";
import type { Expense, Participant, Transfer } from "@/domain/types";
import { allocateExpense, expenseIsBalanced, splitTotal } from "@/domain/engine";
import { AppIcon } from "@/presentation/icons/registry";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { Money } from "./primitives";

const SPLIT_LABEL: Record<string, string> = {
  equal: "Igual",
  exclusive: "Individual",
  custom: "Personalizado",
};

// One color per split type so the list is scannable at a glance — see the
// --split-*/--split-*-soft tokens in styles.css.
const SPLIT_COLOR: Record<string, { color: string; background: string }> = {
  equal: { color: "var(--split-equal)", background: "var(--split-equal-soft)" },
  exclusive: { color: "var(--split-exclusive)", background: "var(--split-exclusive-soft)" },
  custom: { color: "var(--split-custom)", background: "var(--split-custom-soft)" },
};

function SplitTypeChip({ splitType }: { splitType: Expense["splitType"] }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={SPLIT_COLOR[splitType]}
    >
      {SPLIT_LABEL[splitType]}
    </span>
  );
}

export function ExpenseCard({
  expense,
  participants,
  onClick,
}: {
  expense: Expense;
  participants: Participant[];
  onClick?: (() => void) | undefined;
}) {
  const byId = Object.fromEntries(participants.map((p) => [p.id, p]));
  const payer = byId[expense.paidBy];
  const alloc = allocateExpense(expense);
  const involved = Object.keys(alloc).filter((id) => (alloc[id] ?? 0) > 0);
  const ok = expenseIsBalanced(expense);

  return (
    <button
      type="button"
      onClick={onClick}
      className="card-surface animate-rise w-full px-4 py-4 text-left transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-2xl bg-muted">
          <AppIcon iconKey={expense.emoji} size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate font-semibold">{expense.description || "Despesa"}</p>
            <Money cents={expense.totalAmount} />
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {payer ? `Pago por ${payer.name}` : "Sem pagador"}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {involved.slice(0, 6).map((id) => (
                  <ParticipantAvatar key={id} id={id} name={byId[id]?.name ?? "?"} size="sm" />
                ))}
              </div>
              <SplitTypeChip splitType={expense.splitType} />
            </div>
            {!ok ? (
              <span className="rounded-full bg-negative-soft px-2.5 py-1 text-xs font-semibold text-negative">
                Faltam {formatBRL(Math.abs(expense.totalAmount - splitTotal(expense)))}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export function SettlementCard({
  transfer,
  participants,
  index = 0,
  onClick,
}: {
  transfer: Transfer;
  participants: Participant[];
  index?: number | undefined;
  onClick?: (() => void) | undefined;
}) {
  const byId = Object.fromEntries(participants.map((p) => [p.id, p]));
  const from = byId[transfer.from];
  const to = byId[transfer.to];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="card-surface animate-rise flex w-full items-center gap-3 px-4 py-4 text-left transition-transform enabled:hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-default"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <ParticipantAvatar id={from?.id} name={from?.name ?? "?"} />
        <span className="truncate text-sm font-semibold">{from?.name}</span>
      </div>
      <div className="flex flex-col items-center px-1">
        <Money cents={transfer.amount} tone="neutral" size="sm" />
        <ArrowRight aria-hidden="true" className="size-4 text-primary" />
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="truncate text-sm font-semibold">{to?.name}</span>
        <ParticipantAvatar id={to?.id} name={to?.name ?? "?"} />
      </div>
      <span className="sr-only">
        {from?.name} paga {formatBRL(transfer.amount)} para {to?.name}
      </span>
    </button>
  );
}

export function BalanceCard({
  participant,
  paid,
  owed,
  balance,
  onClick,
}: {
  participant: Participant;
  paid: number;
  owed: number;
  balance: number;
  onClick?: (() => void) | undefined;
}) {
  const tone = balance > 0 ? "positive" : balance < 0 ? "negative" : "muted";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="card-surface flex w-full items-center gap-3 px-4 py-3 text-left transition-transform enabled:hover:-translate-y-0.5 disabled:cursor-default"
    >
      <ParticipantAvatar id={participant.id} name={participant.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{participant.name}</p>
        <p className="text-xs text-muted-foreground">
          pagou {formatBRL(paid)} · consumiu {formatBRL(owed)}
        </p>
      </div>
      <Money cents={balance} tone={tone} signed />
    </button>
  );
}

export function PartyStat({
  icon,
  label,
  value,
  className,
}: {
  icon: "people" | "receipt";
  label: string;
  value: string;
  className?: string | undefined;
}) {
  const Icon = icon === "people" ? Users : Receipt;
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Icon aria-hidden="true" className="size-4" />
      <span>
        {value} {label}
      </span>
    </div>
  );
}
