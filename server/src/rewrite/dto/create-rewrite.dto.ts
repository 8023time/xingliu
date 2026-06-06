import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { CreateComplianceRewriteRequest } from '@xingliu/shared/content';

export class CreateRewriteDto implements CreateComplianceRewriteRequest {
  @ApiPropertyOptional({
    description: '改写指令',
    example: '保留原意，降低营销夸张表达',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruction?: string;
}
