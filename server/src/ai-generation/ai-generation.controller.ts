import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthTokenPayload } from '@xingliu/shared/user';
import { AuthGuard } from '@libs/common';
import { AiGenerationService } from './ai-generation.service';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';

type AuthenticatedRequest = Request & { user: AuthTokenPayload };

@Controller('ai')
@UseGuards(AuthGuard)
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Post('generate')
  create(@Req() request: AuthenticatedRequest, @Body() createAiGenerationDto: CreateAiGenerationDto) {
    return this.aiGenerationService.create(request.user.userId, createAiGenerationDto);
  }
}
