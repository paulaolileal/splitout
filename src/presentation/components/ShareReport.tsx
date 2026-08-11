import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { CooperativeHandshake, Transfer } from "@icon-park/react";
import { formatBRL, formatDate } from "@/domain/format";
import type { ShareSnapshot } from "@/domain/share";
import { ParticipantAvatar } from "./ParticipantAvatar";
import { Money } from "./primitives";

export function ShareQRCode({ url }: { url: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { width: 480, margin: 1, color: { dark: "#1b1f24", light: "#ffffff" } })
      .then((value) => {
        if (active) setDataUrl(value);
      })
      .catch(() => setDataUrl(null));
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <div className="card-surface animate-rise flex flex-col items-center gap-3 p-5">
      {dataUrl ? (
        <img src={dataUrl} alt="QR Code do acerto" className="size-48 rounded-xl" />
      ) : (
        <div className="size-48 animate-pulse rounded-xl bg-muted" />
      )}
      <p className="text-sm text-muted-foreground">Escaneie para ver seu acerto</p>
    </div>
  );
}

export function ShareActions({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const share = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Splitout!", text, url });
        return;
      } catch {
        /* usuário cancelou */
      }
    }
    await copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={share}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-pop transition-transform active:scale-[0.98]"
        >
          <Share2 aria-hidden="true" className="size-4" /> Compartilhar
        </button>
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
          {copied ? "Copiado" : "Copiar link"}
        </button>
        <button
          type="button"
          onClick={() => setShowQR((v) => !v)}
          aria-expanded={showQR}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 font-semibold"
        >
          <QrCode aria-hidden="true" className="size-4" /> QR Code
        </button>
      </div>
      {showQR ? <ShareQRCode url={url} /> : null}
    </div>
  );
}

/** Small "copy Pix key" button used inside `pay`/`get` list items — mirrors
 * the copy/copied feedback pattern from `ShareActions` above, scoped to a
 * single item via its own local state. */
function CopyPixButton({ pix, name }: { pix: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(pix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copiar chave Pix de ${name}`}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      {copied ? (
        <Check aria-hidden="true" className="size-3.5 text-positive" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
    </button>
  );
}

export function ShareReport({
  snapshot,
  youLabel = "Você",
}: {
  snapshot: ShareSnapshot;
  youLabel?: string | undefined;
}) {
  const toPay = snapshot.pay.reduce((a, l) => a + l.a, 0);
  const toGet = snapshot.get.reduce((a, l) => a + l.a, 0);
  const net = toGet - toPay;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-3xl">
          {snapshot.e}
        </span>
        <div>
          <h1 className="text-2xl font-extrabold">{snapshot.p}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(snapshot.d)}</p>
        </div>
      </div>

      <div className="card-surface animate-rise overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <ParticipantAvatar name={snapshot.n} size="lg" />
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Acerto de
            </p>
            <p className="text-lg font-bold">{snapshot.n}</p>
          </div>
        </div>
        <dl className="grid grid-cols-2 divide-x divide-border">
          <div className="px-5 py-4">
            <dt className="text-xs text-muted-foreground">{youLabel} consumiu</dt>
            <dd>
              <Money cents={snapshot.o} size="md" />
            </dd>
          </div>
          <div className="px-5 py-4">
            <dt className="text-xs text-muted-foreground">{youLabel} pagou</dt>
            <dd>
              <Money cents={snapshot.q} size="md" />
            </dd>
          </div>
        </dl>
        <div
          className="px-5 py-6 text-center"
          style={{
            backgroundColor:
              net > 0 ? "var(--positive-soft)" : net < 0 ? "var(--negative-soft)" : "var(--muted)",
          }}
        >
          <p className="text-sm font-semibold">
            {net > 0
              ? `${youLabel} recebe`
              : net < 0
                ? `${youLabel} precisa pagar`
                : "Tudo certo, nada a acertar"}
          </p>
          <p className="mt-1 animate-pop">
            <Money
              cents={Math.abs(net)}
              size="xl"
              tone={net > 0 ? "positive" : net < 0 ? "negative" : "muted"}
            />
          </p>
        </div>
      </div>

      {snapshot.pay.length > 0 ? (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            <Transfer theme="multi-color" size={16} /> {youLabel} paga para
          </h2>
          <ul className="space-y-2">
            {snapshot.pay.map((line, i) => (
              <li key={`${line.n}-${i}`} className="card-surface flex items-center gap-3 px-4 py-3">
                <ParticipantAvatar name={line.n} />
                <span className="flex-1 truncate font-semibold">{line.n}</span>
                <Money cents={line.a} tone="negative" />
                {line.pix ? <CopyPixButton pix={line.pix} name={line.n} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.get.length > 0 ? (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            <CooperativeHandshake theme="multi-color" size={16} /> {youLabel} recebe de
          </h2>
          <ul className="space-y-2">
            {snapshot.get.map((line, i) => (
              <li key={`${line.n}-${i}`} className="card-surface flex items-center gap-3 px-4 py-3">
                <ParticipantAvatar name={line.n} />
                <span className="flex-1 truncate font-semibold">{line.n}</span>
                <Money cents={line.a} tone="positive" />
                {line.pix ? <CopyPixButton pix={line.pix} name={line.n} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {snapshot.pay.length === 0 && snapshot.get.length === 0 ? (
        <p className="card-surface px-4 py-6 text-center text-sm text-muted-foreground">
          Nada a acertar — sua parte já está quitada ({formatBRL(snapshot.o)}).
        </p>
      ) : null}
    </div>
  );
}
