import { Injectable } from '@nestjs/common';
import { CreateQualityDto } from './dto/create-quality.dto';
import { UpdateQualityDto } from './dto/update-quality.dto';

@Injectable()
export class QualityService {
  create(createQualityDto: CreateQualityDto) {
    return 'This action adds a new quality';
  }

  findAll() {
    return `This action returns all quality`;
  }

  findOne(id: number) {
    return `This action returns a #${id} quality`;
  }

  update(id: number, updateQualityDto: UpdateQualityDto) {
    return `This action updates a #${id} quality`;
  }

  remove(id: number) {
    return `This action removes a #${id} quality`;
  }
}
