"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";

type Step = "review" | "loading" | "animating" | "receipt";

const PAYMENT = {
  amount: "NOK 500",
  amountReceipt: "500,00",
  fromName: "Lønnskonto",
  fromBalance: "(NOK xx,xxx)",
  fromNumber: "1234.56.78900",
  toName: "Kim Olsen",
  toNumber: "9988.77.66554",
  toInitial: "K",
  message: "“Hello”",
  date: "17 October 2025",
};

export default function PaymentConfirmationPage() {
  const [step, setStep] = useState<Step>("review");

  useEffect(() => {
    if (step === "loading") {
      const t = setTimeout(() => setStep("animating"), 1400);
      return () => clearTimeout(t);
    }
    if (step === "animating") {
      const t = setTimeout(() => setStep("receipt"), 1100);
      return () => clearTimeout(t);
    }
  }, [step]);

  const showCheck = step !== "review";
  const showDimmer = step === "loading" || step === "animating";

  return (
    <main className={styles.scene}>
      <Link href="/" className={styles.backLink}>
        ← Tilbake til prosjekter
      </Link>

      <div className={styles.phone}>
        <div className={styles.screen}>
          <div className={styles.backdrop} />

          <div className={styles.statusBar}>
            <span>9:41</span>
            <span className={styles.statusRight} aria-hidden="true">
              <SignalIcon />
              <WifiIcon />
              <BatteryIcon />
            </span>
          </div>
          <div className={styles.dynamicIsland} aria-hidden="true" />

          {step !== "receipt" && (
            <ReviewSheet
              dim={step !== "review"}
              onConfirm={() => setStep("loading")}
            />
          )}

          {step === "receipt" && <ReceiptSheet />}

          <div
            className={`${styles.dimmer} ${showDimmer ? styles.dimmerActive : ""}`}
            aria-hidden="true"
          />

          {showCheck && (
            <div
              className={`${styles.sharedCheck} ${
                step === "receipt" ? styles.sharedCheckTop : styles.sharedCheckCenter
              }`}
              aria-hidden="true"
            >
              <CheckGraphic phase={step} />
            </div>
          )}

          <p
            className={`${styles.confirmationText} ${
              step === "animating" ? styles.confirmationTextActive : ""
            }`}
            aria-hidden={step !== "animating"}
          >
            Payment complete
          </p>

          {step === "review" && (
            <div className={styles.bottomToolbar}>
              <button type="button" className={styles.toolbarButton} aria-label="Skann">
                <CameraIcon />
              </button>
            </div>
          )}

          <div className={styles.homeIndicator} aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

function ReviewSheet({ onConfirm, dim = false }: { onConfirm: () => void; dim?: boolean }) {
  const [instant, setInstant] = useState(false);

  return (
    <section
      className={`${styles.sheet} ${styles.sheetIn}`}
      style={dim ? { filter: "saturate(0.85)" } : undefined}
      aria-hidden={dim}
    >
      <header className={styles.sheetHeader}>
        <Link href="/" className={`${styles.navButton} ${styles.navClose}`} aria-label="Lukk">
          <CloseIcon />
        </Link>
        <h2 className={styles.sheetTitle}>Pay</h2>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navConfirm}`}
          aria-label="Bekreft betaling"
          onClick={onConfirm}
          disabled={dim}
        >
          <CheckIconSmall />
        </button>
      </header>

      <div className={styles.sheetBody}>
        <div className={styles.amountField}>{PAYMENT.amount}</div>

        <div className={styles.card}>
          <div className={styles.cell}>
            <div className={styles.cellText}>
              <p className={styles.cellTitle}>Use instant payment</p>
              <p className={styles.cellSub}>Price NOK -,--</p>
            </div>
            <button
              type="button"
              className={styles.iosSwitch}
              data-on={instant}
              onClick={() => setInstant((v) => !v)}
              aria-pressed={instant}
              aria-label="Slå på instant payment"
            >
              <span className={styles.iosSwitchHandle} />
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cell}>
            <span className={styles.cellIcon}><MoneyBagIcon /></span>
            <div className={styles.cellText}>
              <p className={styles.cellTitle}>From: {PAYMENT.fromName} {PAYMENT.fromBalance}</p>
              <p className={styles.cellSub}>{PAYMENT.fromNumber}</p>
            </div>
            <span className={styles.cellChevron}><ChevronRightIcon /></span>
          </div>

          <div className={styles.cell}>
            <span className={styles.cellAvatar}>{PAYMENT.toInitial}</span>
            <div className={styles.cellText}>
              <p className={styles.cellTitle}>To: {PAYMENT.toName}</p>
              <p className={styles.cellSub}>{PAYMENT.toNumber}</p>
            </div>
            <span className={styles.cellChevron}><ChevronRightIcon /></span>
          </div>

          <div className={styles.cell}>
            <span className={styles.cellIcon}><BubbleIcon /></span>
            <div className={styles.cellText}>
              <p className={styles.cellSub}>Message</p>
              <p className={styles.cellTitle}>{PAYMENT.message}</p>
            </div>
            <span className={styles.cellChevron}><ChevronRightIcon /></span>
          </div>

          <div className={styles.cell}>
            <span className={styles.cellIcon}><CalendarIcon /></span>
            <div className={styles.cellText}>
              <p className={styles.cellTitle}>{PAYMENT.date}</p>
            </div>
            <span className={styles.cellChevron}><ChevronRightIcon /></span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CheckGraphic({ phase }: { phase: Step }) {
  const showSpinner = phase === "loading";
  const showCheck = phase === "animating" || phase === "receipt";

  return (
    <div className={styles.checkWrap}>
      <svg className={styles.checkCircle} viewBox="0 0 86 86" xmlns="http://www.w3.org/2000/svg">
        <circle cx="43" cy="43" r="43" fill="#003C3D" />
      </svg>
      {showSpinner && (
        <div className={styles.checkSpinner} aria-hidden="true" />
      )}
      {showCheck && (
        <svg className={styles.checkPath} viewBox="0 0 96 86" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M19 46 L36 62 L86 14"
            fill="none"
            stroke="#14D390"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="100"
          />
        </svg>
      )}
    </div>
  );
}

function ReceiptSheet() {
  return (
    <section className={styles.sheet}>
      <header className={styles.sheetHeader}>
        <Link href="/" className={`${styles.navButton} ${styles.navClose}`} aria-label="Lukk">
          <CloseIcon />
        </Link>
        <h2 className={styles.sheetTitle}>Receipt</h2>
      </header>

      <div className={styles.sheetBodyCentered}>
        <div className={styles.receiptHero}>
          <div style={{ width: 96, height: 86 }} aria-hidden="true" />
          <h3 className={styles.receiptTitle}>Payment complete</h3>
          <p className={styles.receiptSubtitle}>Reference 8842 1907</p>
        </div>

        <div className={`${styles.card} ${styles.receiptDetailList}`}>
          <div className={styles.cell}>
            <div className={styles.cellText}>
              <p className={styles.receiptCellTitle}>From</p>
              <p className={styles.receiptCellValue}>{PAYMENT.fromName} {PAYMENT.fromNumber}</p>
            </div>
          </div>
          <div className={styles.cell}>
            <div className={styles.cellText}>
              <p className={styles.receiptCellTitle}>To</p>
              <p className={styles.receiptCellValue}>{PAYMENT.toName} {PAYMENT.toNumber}</p>
            </div>
          </div>
          <div className={styles.cell}>
            <div className={styles.cellText}>
              <p className={styles.receiptCellTitle}>Amount</p>
              <p className={styles.receiptCellValue}>{PAYMENT.amountReceipt}</p>
            </div>
          </div>
          <div className={styles.cell}>
            <div className={styles.cellText}>
              <p className={styles.receiptCellTitle}>Message</p>
              <p className={styles.receiptCellValue}>{PAYMENT.message}</p>
            </div>
          </div>
          <div className={styles.cell}>
            <div className={styles.cellText}>
              <p className={styles.receiptCellTitle}>Date</p>
              <p className={styles.receiptCellValue}>{PAYMENT.date}</p>
            </div>
          </div>
        </div>

        <Link href="/" className={styles.primaryButton} style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
          Close
        </Link>
      </div>
    </section>
  );
}

/* ---------- Inline icons ---------- */

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 6 L18 18 M18 6 L6 18" />
    </svg>
  );
}

function CheckIconSmall() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 L10 17.5 L20 6.5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6 L15 12 L9 18" />
    </svg>
  );
}

function MoneyBagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4 L15 4 L13 7 L11 7 Z" />
      <path d="M11 7 C 6 9 4 14 6 18 C 7 20 9 21 12 21 C 15 21 17 20 18 18 C 20 14 18 9 13 7" />
      <path d="M10.5 13 H13.5 M11.2 11 V15.5 M12.8 11 V15.5" />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5 H20 V16 H13 L8 20 V16 H4 Z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5 H20.5" />
      <path d="M8 3 V6 M16 3 V6" />
      <path d="M14 13 a3 3 0 1 0 0 4" />
      <path d="M16 11 V14 H13" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8 H7 L9 6 H15 L17 8 H20 V18 H4 Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor" aria-hidden="true">
      <rect x="0" y="7" width="3" height="4" rx="0.5" />
      <rect x="5" y="5" width="3" height="6" rx="0.5" />
      <rect x="10" y="3" width="3" height="8" rx="0.5" />
      <rect x="15" y="0" width="3" height="11" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M1 4 C 4 1 12 1 15 4" />
      <path d="M3 6 C 5 4 11 4 13 6" />
      <path d="M5.5 8 C 6.5 7 9.5 7 10.5 8" />
      <circle cx="8" cy="9.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" opacity="0.5" />
      <rect x="2" y="2" width="19" height="8" rx="1.5" fill="currentColor" />
      <rect x="23" y="4" width="2" height="4" rx="0.6" fill="currentColor" opacity="0.5" />
    </svg>
  );
}
