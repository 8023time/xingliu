import { PartialType } from '@nestjs/swagger';
import { CreateRewriteDto } from './create-rewrite.dto';

export class UpdateRewriteDto extends PartialType(CreateRewriteDto) {}
