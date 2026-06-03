import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RewriteService } from './rewrite.service';
import { CreateRewriteDto } from './dto/create-rewrite.dto';
import { UpdateRewriteDto } from './dto/update-rewrite.dto';

@Controller('rewrite')
export class RewriteController {
  constructor(private readonly rewriteService: RewriteService) {}

  @Post()
  create(@Body() createRewriteDto: CreateRewriteDto) {
    return this.rewriteService.create(createRewriteDto);
  }

  @Get()
  findAll() {
    return this.rewriteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewriteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRewriteDto: UpdateRewriteDto) {
    return this.rewriteService.update(+id, updateRewriteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rewriteService.remove(+id);
  }
}
