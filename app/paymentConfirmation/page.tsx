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

          {step === "receipt" && <ReceiptSheet onClose={() => setStep("review")} />}

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

function ReceiptSheet({ onClose }: { onClose: () => void }) {
  return (
    <section className={`${styles.sheet} ${styles.sheetIn}`}>
      <header className={styles.sheetHeader}>
        <button
          type="button"
          className={`${styles.navButton} ${styles.navClose}`}
          aria-label="Lukk"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        <h2 className={styles.sheetTitle}>Receipt</h2>
      </header>

      <div className={styles.sheetBodyCentered}>
        <div className={styles.receiptHero}>
          <div style={{ width: 96, height: 86 }} aria-hidden="true" />
          <h3 className={styles.receiptTitle}>Payment complete</h3>
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

        <button type="button" className={styles.primaryButton} onClick={onClose}>
          Done
        </button>
      </div>
    </section>
  );
}

/* ---------- Inline icons ---------- */

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M5 5 L19 19 M19 5 L5 19" />
    </svg>
  );
}

function CheckIconSmall() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5 L10 17.5 L19.5 7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3 L11 8 L6 13" />
    </svg>
  );
}

function MoneyBagIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M8.25 7.5H15m-.378 2.25H8.628c-2.371 1.77-4.878 4.67-4.878 7.5 0 3.918 1.945 6 7.875 6s7.875-2.082 7.875-6c0-2.83-2.507-5.73-4.878-7.5Zm1.878-9-9 1.5s1.5.818 1.5 3h4.875c0-2.182 2.625-4.5 2.625-4.5Z"
      />
      <path
        fill="currentColor"
        d="M10.799 19.5h1.575l-1.944-2.511L12.239 15h-1.611l-1.314 1.638V13.2H8v6.3h1.314v-1.287l.324-.36 1.161 1.647Zm4.651-4.59c-.576 0-1.071.306-1.323.774V15h-1.17v4.5h1.314v-2.457c0-.657.387-.999 1.152-.999.189 0 .36.018.495.045v-1.125a1.733 1.733 0 0 0-.468-.054Z"
      />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        d="M12.75.75a10.485 10.485 0 0 0-8.916 16.025L.75 23.25l6.474-3.083A10.5 10.5 0 1 0 12.75.75v0Z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.25 1a.75.75 0 0 0-1.5 0h1.5Zm-1.5 5a.75.75 0 0 0 1.5 0h-1.5Zm12.5-5a.75.75 0 0 0-1.5 0h1.5Zm-1.5 5a.75.75 0 0 0 1.5 0h-1.5ZM9 23.25a.75.75 0 0 0 0-1.5v1.5Zm3.333-7.226a.75.75 0 0 0 1.416.494l-1.416-.494Zm10.626.247-.709.247.073.207.172.136.464-.59Zm.708 3.705a.75.75 0 0 0-1.417-.494l1.417.494Zm-10.626-.247.708-.247-.072-.207-.172-.136-.464.59ZM23.25 16.5v.75a.75.75 0 0 0 .75-.75h-.75Zm.75-3.25a.75.75 0 0 0-1.5 0H24Zm-4 2.5a.75.75 0 0 0 0 1.5v-1.5Zm-4 4.5a.75.75 0 0 0 0-1.5v1.5Zm-3.25-.75v-.75a.75.75 0 0 0-.75.75h.75ZM12 22.75a.75.75 0 0 0 1.5 0H12ZM5.75 1v2.5h1.5V1h-1.5Zm0 2.5V6h1.5V3.5h-1.5Zm11-2.5v2.5h1.5V1h-1.5Zm0 2.5V6h1.5V3.5h-1.5ZM2.5 23.25H9v-1.5H2.5v1.5Zm19-20.5h-4v1.5h4v-1.5Zm-4 0h-11v1.5h11v-1.5Zm-11 0h-4v1.5h4v-1.5ZM.75 4.5v5h1.5v-5H.75Zm0 5v12h1.5v-12H.75Zm22.5-1v-4h-1.5v4h1.5ZM1.5 10.25h20v-1.5h-20v1.5ZM21.75 8.5a.25.25 0 0 1-.25.25v1.5a1.75 1.75 0 0 0 1.75-1.75h-1.5Zm-.25-4.25a.25.25 0 0 1 .25.25h1.5a1.75 1.75 0 0 0-1.75-1.75v1.5Zm-19 17.5a.25.25 0 0 1-.25-.25H.75c0 .966.784 1.75 1.75 1.75v-1.5Zm0-19A1.75 1.75 0 0 0 .75 4.5h1.5a.25.25 0 0 1 .25-.25v-1.5Zm11.25 13.768A4.502 4.502 0 0 1 18 13.5V12a6.002 6.002 0 0 0-5.667 4.024l1.416.494ZM18 13.5a4.502 4.502 0 0 1 4.25 3.018l1.417-.494A6.002 6.002 0 0 0 18 12v1.5Zm4.25 5.982A4.502 4.502 0 0 1 18 22.5V24a6.002 6.002 0 0 0 5.667-4.024l-1.417-.494ZM18 22.5a4.502 4.502 0 0 1-4.25-3.018l-1.417.494A6.002 6.002 0 0 0 18 24v-1.5Zm6-6v-3.25h-1.5v3.25H24Zm-.75-.75H20v1.5h3.25v-1.5Zm-7.25 3h-3.25v1.5H16v-1.5Zm-4 .75v3.25h1.5V19.5H12Zm10.495-2.64.292.23.926-1.18-.291-.229-.927 1.18Zm-8.99 2.28-.292-.23-.926 1.18.29.229.928-1.18Z"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8 H7 L8.5 6 H15.5 L17 8 H21 V18 C 21 18.6 20.6 19 20 19 H4 C 3.4 19 3 18.6 3 18 Z" />
      <circle cx="12" cy="13" r="3.6" />
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
