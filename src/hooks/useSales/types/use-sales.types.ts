import { NotificationPayload } from '.'

export interface UseSalesProps {
  disabled?: boolean;
  router?: any;
  sendNotification?: (args: NotificationPayload) => any;
  setAlertBox?: (args: any) => any;
}