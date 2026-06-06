import {Module} from '@nestjs/common';
import {AiModule} from './modules/ai/ai.module';
import {AuthModule} from './modules/auth/auth.module';
import {BudgetsModule} from './modules/budgets/budgets.module';
import {CategoriesModule} from './modules/categories/categories.module';
import {DatabaseModule} from './modules/database/database.module';
import {NotificationsModule} from './modules/notifications/notifications.module';
import {TransactionsModule} from './modules/transactions/transactions.module';
import {AppController} from './app.controller';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    TransactionsModule,
    CategoriesModule,
    BudgetsModule,
    NotificationsModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
