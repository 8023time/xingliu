import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiGenerationService } from './ai-generation.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';
import { UpdateAiGenerationDto } from './dto/update-ai-generation.dto';

@Controller('ai-generation')
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post()
  create(@Body() createAiGenerationDto: CreateAiGenerationDto) {
    return this.aiGenerationService.create(createAiGenerationDto);
  }

  @Get()
  findAll() {
    return this.aiGenerationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiGenerationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiGenerationDto: UpdateAiGenerationDto) {
    return this.aiGenerationService.update(+id, updateAiGenerationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiGenerationService.remove(+id);
  }
}
