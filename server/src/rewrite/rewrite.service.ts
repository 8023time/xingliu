import { Injectable } from '@nestjs/common';
import { CreateRewriteDto } from './dto/create-rewrite.dto';
import { UpdateRewriteDto } from './dto/update-rewrite.dto';

@Injectable()
export class RewriteService {
  create(createRewriteDto: CreateRewriteDto) {
    return 'This action adds a new rewrite';
  }

  findAll() {
    return `This action returns all rewrite`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rewrite`;
  }

  update(id: number, updateRewriteDto: UpdateRewriteDto) {
    return `This action updates a #${id} rewrite`;
  }

  remove(id: number) {
    return `This action removes a #${id} rewrite`;
  }
}
