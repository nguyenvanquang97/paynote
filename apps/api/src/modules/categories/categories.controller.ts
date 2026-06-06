import {Body, Controller, Delete, Get, Param, Put, UseGuards} from '@nestjs/common';
import type {CustomCategory} from '@paynote/shared';
import {AuthGuard} from '../auth/auth.guard';
import {CurrentUser} from '../auth/current-user.decorator';
import type {RequestUser} from '../../shared/request-user';
import {CategoriesService} from './categories.service';

@UseGuards(AuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.categories.list(user.id);
  }

  @Put(':id')
  upsert(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() category: CustomCategory,
  ) {
    return this.categories.upsert(user.id, {...category, id});
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.categories.remove(user.id, id);
  }

  @Get('favorites')
  favorites(@CurrentUser() user: RequestUser) {
    return this.categories.favoriteCategories(user.id);
  }

  @Put('favorites/list')
  setFavorites(@CurrentUser() user: RequestUser, @Body() body: {categoryIds: string[]}) {
    return this.categories.setFavoriteCategories(user.id, body.categoryIds || []);
  }
}
