import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@libs/common';
import { AiGenerationService } from './ai-generation.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

@Controller('ai')
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post('generate')
  @UseGuards(AuthGuard)
  create(@Req() request: Request, @Body() createAiGenerationDto: CreateAiGenerationDto) {
    return this.aiGenerationService.create(request.user.userId, createAiGenerationDto);
  }
}
