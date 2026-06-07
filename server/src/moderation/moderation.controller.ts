import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthTokenPayload } from '@xingliu/shared/user';
import { AuthGuard } from '@libs/common';
import { ModerationService } from './moderation.service';
import { ModerationCheckDto } from './dto/moderation-check.dto';

type AuthenticatedRequest = Request & { user: AuthTokenPayload };

@Controller('moderation')
@UseGuards(AuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('check')
  check(@Req() request: AuthenticatedRequest, @Body() dto: ModerationCheckDto) {
    return this.moderationService.check(request.user.userId, dto);
  }
}
