import {Body, Controller, Delete, Get, Param, Put, Query, UseGuards} from '@nestjs/common';
import type {CategoryBudget} from '@paynote/shared';
import {AuthGuard} from '../auth/auth.guard';
import {CurrentUser} from '../auth/current-user.decorator';
import type {RequestUser} from '../../shared/request-user';
import {BudgetsService} from './budgets.service';

@UseGuards(AuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query('monthKey') monthKey?: string) {
    return this.budgets.list(user.id, monthKey);
  }

  @Put()
  upsert(@CurrentUser() user: RequestUser, @Body() body: CategoryBudget) {
    return this.budgets.upsert(user.id, body);
  }

  @Delete(':monthKey/:categoryId')
  remove(
    @CurrentUser() user: RequestUser,
    @Param('monthKey') monthKey: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.budgets.remove(user.id, categoryId, monthKey);
  }

  @Get('monthly-notes')
  notes(@CurrentUser() user: RequestUser) {
    return this.budgets.monthlyNotes(user.id);
  }

  @Put('monthly-notes/:monthKey')
  setNote(
    @CurrentUser() user: RequestUser,
    @Param('monthKey') monthKey: string,
    @Body() body: {note: string},
  ) {
    return this.budgets.setMonthlyNote(user.id, monthKey, body.note || '');
  }
}
