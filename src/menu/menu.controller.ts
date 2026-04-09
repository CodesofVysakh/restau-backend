import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { MenuItemQueryDto } from './dto/menu-query.dto';
@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}
  @Get('categories')            @ApiOperation({ summary: 'All categories' })          getCategories() { return this.menuService.getCategories(); }
  @Get('items')                 @ApiOperation({ summary: 'Items with filters' })       getItems(@Query() q: MenuItemQueryDto) { return this.menuService.getItems(q); }
  @Get('items/:id')             @ApiOperation({ summary: 'Single item detail' })       getItemById(@Param('id', ParseUUIDPipe) id: string) { return this.menuService.getItemById(id); }
}
