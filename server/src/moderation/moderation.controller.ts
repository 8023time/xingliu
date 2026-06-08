import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@libs/common';
import { ModerationService } from './moderation.service';
import { ModerationCheckDto } from './dto/moderation-check.dto';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('check')
  @UseGuards(AuthGuard)
  check(@Req() request: Request, @Body() dto: ModerationCheckDto) {
    return this.moderationService.check(request.user.userId, dto);
  }
}
