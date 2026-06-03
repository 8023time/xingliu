import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PromptService } from './prompt.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Controller('prompt')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  @Post()
  create(@Body() createPromptDto: CreatePromptDto) {
    return this.promptService.create(createPromptDto);
  }

  @Get()
  findAll() {
    return this.promptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promptService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePromptDto: UpdatePromptDto) {
    return this.promptService.update(+id, updatePromptDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.promptService.remove(+id);
  }
}
