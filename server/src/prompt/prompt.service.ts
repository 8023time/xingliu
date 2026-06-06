import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, ResponseService } from '@libs/common';
import type { Prisma } from '@libs/common/generated/prisma/client';
import { CommonStatus, Visibility } from '@libs/common/generated/prisma/enums';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptQueryDto } from './dto/prompt-query.dto';

const promptSelect = {
  id: true,
  ownerId: true,
  name: true,
  category: true,
  description: true,
  template: true,
  variablesSchema: true,
  modelConfig: true,
  visibility: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PromptService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly responseService: ResponseService,
  ) {}

  async create(userId: string, createPromptDto: CreatePromptDto) {
    const { variablesSchema, modelConfig, ...promptData } = createPromptDto;
    const prompt = await this.prismaService.promptTemplate.create({
      data: {
        ...promptData,
        variablesSchema: variablesSchema as Prisma.InputJsonValue | undefined,
        modelConfig: modelConfig as Prisma.InputJsonValue | undefined,
        ownerId: userId,
        visibility: Visibility.PRIVATE,
      },
      select: promptSelect,
    });

    return this.responseService.success(prompt, '创建 Prompt 成功');
  }

  async findAll(userId: string, query: PromptQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = {
      status: CommonStatus.ACTIVE,
      category: query.category,
      OR: [{ ownerId: userId }, { visibility: { in: [Visibility.PUBLIC, Visibility.SYSTEM] } }],
    } satisfies Prisma.PromptTemplateWhereInput;
    const [items, total] = await Promise.all([
      this.prismaService.promptTemplate.findMany({
        where,
        select: promptSelect,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prismaService.promptTemplate.count({ where }),
    ]);

    return this.responseService.success(
      {
        page,
        pageSize,
        total,
        items,
      },
      '获取 Prompt 列表成功',
    );
  }

  async findOne(userId: string, id: string) {
    const prompt = await this.prismaService.promptTemplate.findFirst({
      where: {
        id,
        status: CommonStatus.ACTIVE,
        OR: [{ ownerId: userId }, { visibility: { in: [Visibility.PUBLIC, Visibility.SYSTEM] } }],
      },
      select: promptSelect,
    });

    if (!prompt) {
      throw new NotFoundException('Prompt 不存在');
    }

    return this.responseService.success(prompt, '获取 Prompt 成功');
  }

  async update(userId: string, id: string, updatePromptDto: UpdatePromptDto) {
    await this.assertOwnedPrompt(userId, id);

    const { variablesSchema, modelConfig, ...promptData } = updatePromptDto;
    const prompt = await this.prismaService.promptTemplate.update({
      where: { id },
      data: {
        ...promptData,
        variablesSchema: variablesSchema as Prisma.InputJsonValue | undefined,
        modelConfig: modelConfig as Prisma.InputJsonValue | undefined,
      },
      select: promptSelect,
    });

    return this.responseService.success(prompt, '更新 Prompt 成功');
  }

  async remove(userId: string, id: string) {
    await this.assertOwnedPrompt(userId, id);

    await this.prismaService.promptTemplate.update({
      where: { id },
      data: { status: CommonStatus.DELETED },
    });

    return this.responseService.success(null, '删除 Prompt 成功');
  }

  private async assertOwnedPrompt(userId: string, id: string) {
    const prompt = await this.prismaService.promptTemplate.findFirst({
      where: {
        id,
        ownerId: userId,
        status: CommonStatus.ACTIVE,
        visibility: Visibility.PRIVATE,
      },
      select: { id: true },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt 不存在或无权操作');
    }
  }
}
