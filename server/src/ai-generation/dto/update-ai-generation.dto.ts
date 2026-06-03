import { PartialType } from '@nestjs/swagger';
import { CreateAiGenerationDto } from './create-ai-generation.dto';

export class UpdateAiGenerationDto extends PartialType(CreateAiGenerationDto) {}
