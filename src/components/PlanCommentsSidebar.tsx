"use client";

import { useState } from "react";
import type { PlanGeneralComment, PlanPin, Role } from "@/lib/types";
import Stamp from "./Stamp";
import { formatCommentTime, roleLabel } from "@/lib/commentUtils";

type ThreadProps = {
  id: string;
  author: Role;
  text: string;
  createdAt: string;
  resolved?: boolean;
  replies: { id: string; author: Role; text: string; createdAt: string }[];
  isPin?: boolean;
  onReply: (text: string) => void;
  onToggleResolved?: () => void;
};

function CommentThread({
  id,
  author,
  text,
  createdAt,
  resolved,
  replies,
  isPin,
  onReply,
  onToggleResolved,
}: ThreadProps) {
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);

  function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onReply(trimmed);
    setReplyText("");
    setShowReply(false);
  }

  return (
    <div
      className="rounded-sm border-2 p-3"
      style={{
        borderColor: "rgba(80, 84, 35, 0.2)",
        backgroundColor: resolved ? "rgba(80, 84, 35, 0.06)" : "transparent",
      }}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-wide"
          style={{
            color: author === "macondo" ? "var(--primary)" : "var(--terracotta)",
            fontFamily: "var(--font-body)",
          }}
        >
          {roleLabel(author)}
          {isPin && (
            <span className="ml-1.5 opacity-60" style={{ color: "var(--graphite)" }}>
              · pin
            </span>
          )}
        </span>
        <span className="text-[10px] opacity-50" style={{ fontFamily: "var(--font-body)" }}>
          {formatCommentTime(createdAt)}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--graphite)" }}>
        {text}
      </p>

      {replies.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 border-l-2 pl-3" style={{ borderColor: "rgba(80,84,35,0.15)" }}>
          {replies.map((r) => (
            <li key={r.id}>
              <div className="text-[10px] font-semibold uppercase" style={{ color: "var(--primary-light)" }}>
                {roleLabel(r.author)} · {formatCommentTime(r.createdAt)}
              </div>
              <p className="text-xs" style={{ color: "var(--graphite)" }}>
                {r.text}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowReply((v) => !v)}
          className="focus-ring text-[10px] uppercase tracking-wide underline-offset-2 hover:underline"
          style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
        >
          Responder
        </button>
        {isPin && onToggleResolved && (
          <Stamp
            active={!!resolved}
            label="Pendiente"
            activeLabel="Resuelto"
            color="growth"
            size="sm"
            onClick={onToggleResolved}
          />
        )}
      </div>

      {showReply && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Escribe una respuesta…"
            className="focus-ring w-full resize-none rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
            style={{ borderColor: "rgba(80,84,35,0.25)", color: "var(--graphite)" }}
          />
          <button
            type="button"
            onClick={submitReply}
            disabled={!replyText.trim()}
            className="focus-ring self-end rounded-sm border-2 px-3 py-1 text-[10px] font-bold uppercase disabled:opacity-40"
            style={{
              borderColor: "var(--primary)",
              backgroundColor: "var(--primary)",
              color: "var(--cream)",
              fontFamily: "var(--font-body)",
            }}
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlanCommentsSidebar({
  pins,
  generalComments,
  selectedPinId,
  onAddGeneral,
  onReplyPin,
  onReplyGeneral,
  onToggleResolved,
  onSelectPin,
}: {
  pins: PlanPin[];
  generalComments: PlanGeneralComment[];
  selectedPinId: string | null;
  onAddGeneral: (text: string) => void;
  onReplyPin: (pinId: string, text: string) => void;
  onReplyGeneral: (commentId: string, text: string) => void;
  onToggleResolved: (pinId: string) => void;
  onSelectPin: (pinId: string | null) => void;
}) {
  const [generalText, setGeneralText] = useState("");

  const sortedPins = [...pins].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const sortedGeneral = [...generalComments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function submitGeneral() {
    const trimmed = generalText.trim();
    if (!trimmed) return;
    onAddGeneral(trimmed);
    setGeneralText("");
  }

  return (
    <aside
      className="flex w-full flex-col gap-4 rounded-sm border-2 p-4 lg:w-80 lg:shrink-0"
      style={{ borderColor: "var(--primary-light)", backgroundColor: "var(--paper)", color: "var(--graphite)" }}
    >
      <div>
        <h3
          className="text-sm font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
        >
          Comentarios de hoja
        </h3>
        <p className="mt-1 text-[11px] opacity-60" style={{ fontFamily: "var(--font-body)" }}>
          Notas generales sin ubicación en el plano.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          value={generalText}
          onChange={(e) => setGeneralText(e.target.value)}
          rows={3}
          placeholder="Comentario general de esta hoja…"
          className="focus-ring w-full resize-none rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
          style={{ borderColor: "rgba(80,84,35,0.25)", color: "var(--graphite)" }}
        />
        <button
          type="button"
          onClick={submitGeneral}
          disabled={!generalText.trim()}
          className="focus-ring rounded-sm border-2 py-2 text-xs font-bold uppercase disabled:opacity-40"
          style={{
            borderColor: "var(--primary)",
            backgroundColor: "var(--primary)",
            color: "var(--cream)",
            fontFamily: "var(--font-body)",
          }}
        >
          Agregar comentario
        </button>
      </div>

      <div className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto lg:max-h-[50vh]">
        {selectedPinId && (
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--terracotta)" }}>
            Pin seleccionado en el plano
          </div>
        )}

        {sortedPins.map((pin) => (
          <div
            key={pin.id}
            className={pin.id === selectedPinId ? "ring-2 ring-offset-1" : ""}
            style={
              pin.id === selectedPinId
                ? { outline: "2px solid var(--terracotta)", outlineOffset: 2 }
                : undefined
            }
            onClick={() => onSelectPin(pin.id)}
          >
            <CommentThread
              id={pin.id}
              author={pin.author}
              text={pin.text}
              createdAt={pin.createdAt}
              resolved={pin.resolved}
              replies={pin.replies}
              isPin
              onReply={(text) => onReplyPin(pin.id, text)}
              onToggleResolved={() => onToggleResolved(pin.id)}
            />
          </div>
        ))}

        {sortedGeneral.map((c) => (
          <CommentThread
            key={c.id}
            id={c.id}
            author={c.author}
            text={c.text}
            createdAt={c.createdAt}
            replies={c.replies}
            onReply={(text) => onReplyGeneral(c.id, text)}
          />
        ))}

        {sortedPins.length === 0 && sortedGeneral.length === 0 && (
          <p className="text-center text-xs opacity-50" style={{ fontFamily: "var(--font-body)" }}>
            Sin comentarios en esta hoja.
          </p>
        )}
      </div>
    </aside>
  );
}
