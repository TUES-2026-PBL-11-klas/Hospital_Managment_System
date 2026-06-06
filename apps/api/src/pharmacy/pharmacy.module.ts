import { Module } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [PharmacyService],
  exports: [PharmacyService],
})
export class PharmacyModule {}
