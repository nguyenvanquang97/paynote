import {NOTIFICATION_CATEGORY_TEMPLATES} from './notificationCategoryTemplates';
import {PLAN_NOTIFICATION_TEMPLATES} from './notificationPlanTemplates';
import type {NotificationTemplate} from './notificationTypes';

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  ...PLAN_NOTIFICATION_TEMPLATES,
  ...NOTIFICATION_CATEGORY_TEMPLATES,
];
