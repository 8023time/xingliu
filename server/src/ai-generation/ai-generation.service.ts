import { Injectable } from '@nestjs/common';
import { CreateAiGenerationDto } from './dto/create-ai-generation.dto';
import { UpdateAiGenerationDto } from './dto/update-ai-generation.dto';

@Injectable()
export class AiGenerationService {
  create(createAiGenerationDto: CreateAiGenerationDto) {
    return 'This action adds a new aiGeneration';
  }

  findAll() {
    return `This action returns all aiGeneration`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiGeneration`;
  }

  update(id: number, updateAiGenerationDto: UpdateAiGenerationDto) {
    return `This action updates a #${id} aiGeneration`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiGeneration`;
  }
}
