"use client";

import { List } from "@dnb/eufemia/components";

import TransactionRow from "./TransactionRow";
import type { Transaction } from "./data";

/** Ett tall i sum-raden, eller sum-radens subline. `negative` gir error-fargen. */
export type SumText = { text: string; negative?: boolean };

export type GroupSum = {
  label: string;
  /** «Til forfall» gruppert på konto bruker denne til «Penger til overs <dato>».
   *  Gruppert på dato har ingen subline. */
  subline?: SumText;
  /** Konto viser sum + fremtidig saldo (to linjer), dato viser bare sum. */
  amounts: SumText[];
};

const negativeStyle = { color: "var(--token-color-text-error)" };

/**
 * Ett gruppekort: en accordion med rader, og valgfritt en sum-rad under.
 *
 * Erstatter de tre nesten identiske rendererne siden hadde
 * (renderKontoGroups / renderEierGroups / renderDatoGroups). De skilte seg bare
 * på gruppenøkkel, headerinnhold, overline og sum-rad — alt fire ting kalleren
 * nå sender inn. Dermed er kortets ramme, hjørner og radlogikk beskrevet på ett
 * sted i stedet for tre.
 */
export default function GroupCard({
  open,
  onToggle,
  header,
  headerEnd,
  rows,
  overlineFor,
  sum,
  balanceFor,
  warningFor,
  confirmedIds,
  onConfirm,
}: {
  open: boolean;
  onToggle: () => void;
  header: React.ReactNode;
  /** Saldo til høyre i headeren. Utelates for grupperinger der gruppen ikke
   *  har en saldo (dato, fakturaeier). */
  headerEnd?: React.ReactNode;
  rows: Transaction[];
  overlineFor: (tx: Transaction) => string;
  /** Utelates når gruppen ikke skal ha sum-rad. Uten sum-rad blir headeren både
   *  first- og last-of-type i containeren, og får dermed alle fire hjørner
   *  avrundet av seg selv (se paymentsOverview.css). */
  sum?: GroupSum;
  balanceFor?: (tx: Transaction) => number | undefined;
  warningFor?: (tx: Transaction) => string | undefined;
  confirmedIds: Set<string>;
  onConfirm: (id: string) => void;
}) {
  return (
    <div className="po-group">
      <List.Container>
        <List.Item.Accordion open={open} chevronPosition="right" className="po-group__head">
          <List.Item.Accordion.Header onClick={onToggle}>
            <List.Cell.Title className="po-group__title">{header}</List.Cell.Title>
            {headerEnd !== undefined && (
              <List.Cell.End>
                <span className="po-group__balance">{headerEnd}</span>
              </List.Cell.End>
            )}
          </List.Item.Accordion.Header>
          <List.Item.Accordion.Content>
            <List.Container>
              {rows.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  overline={overlineFor(tx)}
                  balanceAfter={balanceFor?.(tx)}
                  warning={warningFor?.(tx)}
                  isConfirmed={confirmedIds.has(tx.id)}
                  onConfirm={() => onConfirm(tx.id)}
                />
              ))}
            </List.Container>
          </List.Item.Accordion.Content>
        </List.Item.Accordion>

        {sum && (
          <List.Item.Basic className="po-group__sum">
            <List.Cell.Title>
              {sum.label}
              {sum.subline && (
                <List.Cell.Title.Subline
                  fontSize="basis"
                  style={sum.subline.negative ? negativeStyle : undefined}
                >
                  {sum.subline.text}
                </List.Cell.Title.Subline>
              )}
            </List.Cell.Title>
            <List.Cell.End>
              <div className="po-group__sum-amounts">
                {sum.amounts.map((a, i) => (
                  <span
                    key={i}
                    className="dnb-t__size--basis"
                    style={a.negative ? negativeStyle : undefined}
                  >
                    {a.text}
                  </span>
                ))}
              </div>
            </List.Cell.End>
          </List.Item.Basic>
        )}
      </List.Container>
    </div>
  );
}
