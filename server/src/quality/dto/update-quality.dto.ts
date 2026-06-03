import { PartialType } from '@nestjs/swagger';
import { CreateQualityDto } from './create-quality.dto';

export class UpdateQualityDto extends PartialType(CreateQualityDto) {}
