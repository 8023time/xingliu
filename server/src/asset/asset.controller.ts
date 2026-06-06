import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { AuthGuard } from '@libs/common';
import { AssetService } from './asset.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetQueryDto } from './dto/asset-query.dto';
import { AssetParamDto } from './dto/asset-param.dto';

interface UploadedAssetFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  /**
   * 创建资产，支持上传文件或提供URL链接
   */
  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  create(@Req() request: Request, @Body() createAssetDto: CreateAssetDto, @UploadedFile() file?: UploadedAssetFile) {
    return this.assetService.create(request.user.userId, createAssetDto, file);
  }

  /**
   * 获取当前用户的所有素材
   */
  @Get()
  @UseGuards(AuthGuard)
  findAll(@Req() request: Request, @Query() query: AssetQueryDto) {
    return this.assetService.findAll(request.user.userId, query);
  }

  /**
   * 根据素材 id 查找获取对应的素材
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  findOne(@Req() request: Request, @Param() params: AssetParamDto) {
    return this.assetService.findOne(request.user.userId, params.id);
  }

  /**
   * 更新资产信息，支持更改名称、链接、标签等属性
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  update(@Req() request: Request, @Param() params: AssetParamDto, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetService.update(request.user.userId, params.id, updateAssetDto);
  }

  /**
   * 根据素材 id 删除素材
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  remove(@Req() request: Request, @Param() params: AssetParamDto) {
    return this.assetService.remove(request.user.userId, params.id);
  }

  /**
   * 资产审核接口，管理员可以通过该接口对资产进行审核，改变其安全状态（安全、风险、未知）
   */
  @Post(':id/moderation')
  @UseGuards(AuthGuard)
  moderate(@Req() request: Request, @Param() params: AssetParamDto) {
    return this.assetService.moderate(request.user.userId, params.id);
  }
}
