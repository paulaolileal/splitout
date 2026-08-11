import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildGroupShareText, buildIndividualShareText, buildSnapshot } from "@/domain/report";
import { encodeSnapshot } from "@/domain/share";
import { buildWhatsAppLink } from "@/domain/format";
import type { Participant, Party } from "@/domain/types";
import { ParticipantAvatar } from "./ParticipantAvatar";

/** Individual mode (`participant` set) shares one person's settlement —
 * same text/link as `ParticipantReportPage` — and offers to open WhatsApp
 * with that person's number, collecting it on the spot when the participant
 * has none saved. Group mode (`participant` absent) shares every transfer
 * in the party, with no fixed recipient (`wa.me/?text=...`), meant for
 * pasting into a group. */
export function WhatsAppShareModal({
  open,
  onClose,
  party,
  participant,
  onSavePhone,
}: {
  open: boolean;
  onClose: () => void;
  party: Party;
  participant?: Participant | undefined;
  onSavePhone?: ((participantId: string, phone: string) => void) | undefined;
}) {
  const [phone, setPhone] = useState(participant?.phone ?? "");
  const [savePhone, setSavePhone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPhone(participant?.phone ?? "");
    setSavePhone(false);
    setCopied(false);
  }, [participant?.id, participant?.phone, open]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  let text = "";
  if (participant) {
    const snapshot = buildSnapshot(party, participant.id);
    if (snapshot)
      text = `${buildIndividualShareText(snapshot)} ${origin}/r/${encodeSnapshot(snapshot)}`;
  } else {
    text = buildGroupShareText(party);
  }

  const needsPhone = !!participant && !participant.phone;
  const effectivePhone = participant ? phone : null;
  const canSend = !needsPhone || phone.trim().length > 0;

  const openWhatsApp = () => {
    if (participant && needsPhone && savePhone && phone.trim() && onSavePhone) {
      onSavePhone(participant.id, phone.trim());
    }
    window.open(buildWhatsAppLink(effectivePhone, text), "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-3xl p-0 sm:max-w-sm">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
            {participant ? (
              <>
                <ParticipantAvatar id={participant.id} name={participant.name} size="sm" />
                Enviar para {participant.name}
              </>
            ) : (
              "Enviar resumo do rolê"
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-5">
          <p className="rounded-2xl bg-muted/50 p-4 text-sm whitespace-pre-line">{text}</p>

          {needsPhone ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold">WhatsApp de {participant?.name}</p>
              <input
                aria-label="Telefone"
                type="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 91234-5678"
                className="w-full rounded-2xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              />
              {onSavePhone ? (
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={savePhone}
                    onChange={(e) => setSavePhone(e.target.checked)}
                  />
                  Salvar esse telefone para a próxima vez
                </label>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-border bg-card px-5 py-4">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 font-semibold"
          >
            {copied ? (
              <Check aria-hidden="true" className="size-4 text-positive" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <button
            type="button"
            onClick={openWhatsApp}
            disabled={!canSend}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-bold text-primary-foreground shadow-pop transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            <MessageCircle aria-hidden="true" className="size-4" /> Abrir WhatsApp
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
