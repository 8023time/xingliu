import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DraftService } from './draft.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@Controller('draft')
export class DraftController {
  constructor(private readonly draftService: DraftService) {}

  @Post()
  create(@Body() createDraftDto: CreateDraftDto) {
    return this.draftService.create(createDraftDto);
  }

  @Get()
  findAll() {
    return this.draftService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.draftService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDraftDto: UpdateDraftDto) {
    return this.draftService.update(+id, updateDraftDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.draftService.remove(+id);
  }
}
