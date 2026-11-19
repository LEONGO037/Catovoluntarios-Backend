import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { RegisterDto } from './dtos/register.dto';
import { Role } from '../../common/enums/role.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas o usuario no registrado');
    }

    if (!user.activo) {
      throw new UnauthorizedException('Tu cuenta ha sido desactivada temporalmente por Pastoral UCB');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas o contraseña no válida');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      nombres: `${user.nombres} ${user.primerApellido}`,
      ci: user.ci,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: '7d',
      user: {
        id: user.id,
        ci: user.ci,
        email: user.email,
        rol: user.rol,
        nombres: user.nombres,
        primerApellido: user.primerApellido,
        segundoApellido: user.segundoApellido,
        carrera: user.carrera,
        telefono: user.telefono,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Por seguridad evitamos revelar si el email existe
      return {
        success: true,
        message:
          'Si el correo está registrado en Pastoral, se ha enviado un correo mediante Resend con las instrucciones de recuperación (válido por 15 minutos).',
      };
    }

    // Token temporal firmado para reseteo (15 min)
    const resetToken = this.jwtService.sign(
      { sub: user.id, purpose: 'reset_password', email: user.email },
      { expiresIn: '15m' },
    );

    // Envío del correo institucional mediante el servicio de Resend
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.nombres,
      resetToken,
    );

    return {
      success: true,
      message:
        'Se ha enviado un correo electrónico mediante Resend con tu enlace seguro de recuperación de contraseña.',
      resetToken, // Retornado también en la respuesta JSON para facilitar pruebas locales inmediatas
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    let payload: { sub: number; purpose?: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('El token de reseteo es inválido o ha expirado');
    }

    if (payload.purpose !== 'reset_password') {
      throw new BadRequestException('Token no válido para restablecimiento de contraseña');
    }

    await this.usersService.updatePassword(payload.sub, newPassword);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva clave.',
    };
  }

  async register(registerDto: RegisterDto) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const newUser = await this.usersService.create({
      ci: registerDto.ci,
      email: registerDto.email,
      passwordHash,
      nombres: registerDto.nombres,
      primerApellido: registerDto.primerApellido,
      segundoApellido: registerDto.segundoApellido,
      rol: registerDto.rol || Role.POSTULANTE,
      telefono: registerDto.telefono,
      carrera: registerDto.carrera,
      activo: true,
    });

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      rol: newUser.rol,
      nombres: `${newUser.nombres} ${newUser.primerApellido}`,
      ci: newUser.ci,
    };

    const token = this.jwtService.sign(payload);

    return {
      accessToken: token,
      user: {
        id: newUser.id,
        ci: newUser.ci,
        email: newUser.email,
        rol: newUser.rol,
        nombres: newUser.nombres,
        primerApellido: newUser.primerApellido,
        carrera: newUser.carrera,
      },
    };
  }
}
