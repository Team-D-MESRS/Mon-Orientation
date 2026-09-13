import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto/auth.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('inscription')
  @ApiOperation({ summary: 'Créer un compte' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('connexion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir le token' })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('deconnexion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se déconnecter' })
  async logout(@Body('userId') userId: string) {
    return this.authService.logout(userId);
  }
}
