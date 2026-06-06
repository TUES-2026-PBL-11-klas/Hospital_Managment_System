import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  imports: [DoctorsModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
