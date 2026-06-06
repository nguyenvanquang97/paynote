import {Body, Controller, Delete, Get, Param, Patch, Post, UseGuards} from '@nestjs/common';
import type {InAppNotificationItem} from '@paynote/shared';
import {AuthGuard} from '../auth/auth.guard';
import {CurrentUser} from '../auth/current-user.decorator';
import type {RequestUser} from '../../shared/request-user';
import {NotificationsService} from './notifications.service';

@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notifications.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() body: Omit<InAppNotificationItem, 'id' | 'createdAt' | 'isRead'>,
  ) {
    return this.notifications.create(user.id, body);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() body: {isRead: boolean}) {
    return this.notifications.markRead(user.id, id, Boolean(body.isRead));
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notifications.remove(user.id, id);
  }

  @Delete()
  clear(@CurrentUser() user: RequestUser) {
    return this.notifications.clear(user.id);
  }
}
