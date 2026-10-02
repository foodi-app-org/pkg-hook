import type { SendNotificationFn, SetAlertBoxFn } from 'typesdefs'

/**
 * Payload delivered to `onSaleSuccess` once `registerSalesStore` resolves with
 * `success === true`. It lets the consumer drive the post-sale UX (e.g. show a
 * success modal) with an explicit signal instead of watching internal state.
 */
export interface SaleSuccessPayload {
  code: string | null;
}

export interface UseSalesProps {
  disabled?: boolean;
  router?: unknown;
  sendNotification?: SendNotificationFn;
  setAlertBox?: SetAlertBoxFn;
  /**
   * Optional callback fired only when a sale is registered successfully,
   * after the invoice/print modal has been closed. Backwards compatible:
   * existing consumers that don't pass it keep the current behavior.
   */
  onSaleSuccess?: (payload: SaleSuccessPayload) => void;
}