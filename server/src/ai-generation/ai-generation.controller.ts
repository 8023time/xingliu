import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
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

  @Post('generate/stream')
  @UseGuards(AuthGuard)
  async createStream(
    @Req() request: Request,
    @Body() createAiGenerationDto: CreateAiGenerationDto,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders?.();

    for await (const event of this.aiGenerationService.createStream(request.user.userId, createAiGenerationDto)) {
      response.write(`event: ${event.type}\n`);
      response.write(`data: ${JSON.stringify(event.data)}\n\n`);
    }

    response.end();
  }
}
