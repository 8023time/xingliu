import { PartialType } from '@nestjs/swagger';
import type { UpdatePromptRequest } from '@xingliu/shared/prompt';
import { CreatePromptDto } from './create-prompt.dto';

export class UpdatePromptDto extends PartialType(CreatePromptDto) implements UpdatePromptRequest {}
