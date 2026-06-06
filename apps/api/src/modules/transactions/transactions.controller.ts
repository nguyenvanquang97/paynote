import {Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards} from '@nestjs/common';
import {CreateTransactionDto, TransactionListQuery, UpdateTransactionDto} from '@paynote/shared';
import {CurrentUser} from '../auth/current-user.decorator';
import {AuthGuard} from '../auth/auth.guard';
import type {RequestUser} from '../../shared/request-user';
import {TransactionsService} from './transactions.service';

@UseGuards(AuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: TransactionListQuery) {
    return this.transactions.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() body: CreateTransactionDto) {
    return this.transactions.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateTransactionDto,
  ) {
    return this.transactions.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.transactions.remove(user.id, id);
  }

  @Get('stats/monthly')
  monthlyStats(
    @CurrentUser() user: RequestUser,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.transactions.monthlyStats(user.id, Number(year), Number(month));
  }

  @Get('stats/categories')
  categoryStats(
    @CurrentUser() user: RequestUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.transactions.categoryStats(user.id, Number(startDate), Number(endDate));
  }
}
