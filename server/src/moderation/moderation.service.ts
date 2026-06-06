import { Injectable, NotFoundException } from '@nestjs/common';
import { ModerationService as CommonModerationService, PrismaService, ResponseService } from '@libs/common';
import { CommonStatus, Visibility } from '@libs/common/generated/prisma/enums';
import type { AssetModerationResult, TextModerationResult } from '@libs/common';
import { ModerationCheckDto } from './dto/moderation-check.dto';

@Injectable()
export class ModerationService {
  constructor(
    private readonly moderationService: CommonModerationService,
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}

  async check(userId: string, dto: ModerationCheckDto) {
    await this.assertSubjectAccessible(userId, dto);
    const result = dto.text
      ? await this.moderationService.moderateText(dto.text)
      : await this.moderationService.moderateImage(dto.assetUrl!);

    return this.responseService.success(toStandardResult(result), '内容预检完成');
  }

  private async assertSubjectAccessible(userId: string, dto: ModerationCheckDto) {
    if (!dto.subjectId) return;

    const exists =
      dto.subjectType === 'prompt'
        ? await this.prismaService.promptTemplate.findFirst({
            where: {
              id: dto.subjectId,
              status: CommonStatus.ACTIVE,
              OR: [{ ownerId: userId }, { visibility: { in: [Visibility.PUBLIC, Visibility.SYSTEM] } }],
            },
            select: { id: true },
          })
        : dto.subjectType === 'content'
          ? await this.prismaService.content.findFirst({
              where: { id: dto.subjectId, authorId: userId, deletedAt: null },
              select: { id: true },
            })
          : await this.prismaService.asset.findFirst({
              where: { id: dto.subjectId, userId, deletedAt: null },
              select: { id: true },
            });

    if (!exists) throw new NotFoundException('预检对象不存在或无权访问');
  }
}

function toStandardResult(result: AssetModerationResult | TextModerationResult) {
  return {
    decision:
      result.riskLevel === 'high' ? 'reject' : result.riskLevel === 'medium' ? 'need_rewrite' : ('pass' as const),
    riskLevel: result.riskLevel,
    labels: result.labels,
    reason: result.reason,
    riskSpans: 'riskSpans' in result ? result.riskSpans : [],
    providerRequestId: result.requestId,
  };
}
