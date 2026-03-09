declare module "@cashfreepayments/cashfree-js" {
  interface CashfreeConfig {
    mode: "sandbox" | "production";
  }

  interface CheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_top" | "_parent";
  }

  interface CashfreeInstance {
    checkout: (options: CheckoutOptions) => Promise<void>;
  }

  export function load(config: CashfreeConfig): Promise<CashfreeInstance>;
}
