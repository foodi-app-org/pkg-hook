import { SendNotificationFn, SetAlertBoxFn } from 'typesdefs'

export interface UseSalesProps {
  disabled?: boolean;
  router?: unknown;
  sendNotification?: SendNotificationFn;
  setAlertBox?: SetAlertBoxFn;
}