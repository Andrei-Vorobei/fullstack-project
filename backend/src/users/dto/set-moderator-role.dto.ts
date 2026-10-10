import { IsBoolean } from 'class-validator';

export class SetModeratorRoleDto {
  @IsBoolean()
  enabled: boolean;
}
