"use client";

import { useId, useState } from "react";
import { Button, Textarea } from "@dnb/eufemia/components";
import { P } from "@dnb/eufemia/elements";
import { thumbs_down, thumbs_up } from "@dnb/eufemia/icons";

type Answer = "liker" | "liker-ikke";

const OPTIONS: { answer: Answer; label: string; icon: typeof thumbs_up }[] = [
  { answer: "liker", label: "Liker", icon: thumbs_up },
  { answer: "liker-ikke", label: "Liker ikke", icon: thumbs_down },
];

/**
 * Tilbakemeldingsmodul nederst på siden, etter mønsteret «Hva synes du om
 * sparemål?» i nettbanken. Eufemia har ingen egen komponent for dette, så den er
 * satt sammen av P, runde ikonknapper (secondary, bare ikon) og Textarea.
 *
 * Tre tilstander: spørsmål → valgt svar med valgfri kommentar → takk. Valget
 * kan endres mens kommentarfeltet er åpent (aria-pressed viser hvilket som er
 * valgt). Teksten ved siden av knappen er knappens navn via aria-labelledby,
 * slik at skjermleseren sier «Liker, knapp» og ikke bare «tommel opp». Svaret
 * lagres ikke.
 */
export default function FeedbackModule({ id: anchorId, question }: { id?: string; question: string }) {
  const id = useId();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const className = ["po-feedback", answer && !sent && "po-feedback--open"].filter(Boolean).join(" ");

  return (
    <section id={anchorId} className={className} aria-labelledby={`${id}-question`}>
      <div className="po-feedback__top">
        <P id={`${id}-question`} size="medium" className="po-feedback__question">
          {question}
        </P>
        {/* role="status": takken leses opp når den erstatter knappene. */}
        <div role="status">
          {sent ? (
            <P size="medium">Takk for tilbakemeldingen!</P>
          ) : (
            <div className="po-feedback__options">
              {OPTIONS.map(({ answer: a, label, icon }) => (
                <div
                  key={a}
                  className={[
                    "po-feedback__option",
                    answer && "po-feedback__option--answered",
                    answer === a && "po-feedback__option--selected",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <P id={`${id}-${a}`} size="medium">
                    {label}
                  </P>
                  <Button
                    variant="secondary"
                    size="medium"
                    icon={icon}
                    aria-labelledby={`${id}-${a}`}
                    aria-pressed={answer === a}
                    onClick={() => setAnswer(a)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {answer && !sent && (
        <div className="po-feedback__form">
          <Textarea
            label="Vil du legge til noe? (Valgfritt)"
            placeholder="Ikke oppgi personlige opplysninger eller sensitiv informasjon i dette feltet."
            rows={4}
            stretch
            value={comment}
            onChange={({ value }) => setComment(value)}
          />
          <Button variant="primary" size="large" text="Send inn" onClick={() => setSent(true)} />
        </div>
      )}
    </section>
  );
}
