import {Body, Controller, Post, UseGuards} from '@nestjs/common';
import type {AiChatRequest} from '@paynote/shared';
import {AuthGuard} from '../auth/auth.guard';
import {AiService} from './ai.service';

@UseGuards(AuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  chat(@Body() body: AiChatRequest) {
    return this.ai.chat(body);
  }
}
