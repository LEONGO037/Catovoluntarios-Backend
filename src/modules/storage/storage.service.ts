import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

export interface UploadResult {
  url: string;
  key: string;
  nombreArchivo: string;
  tamanioBytes: number;
  mimeType: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly bucketDocumentos: string;
  private readonly publicUrl: string;
  private readonly isR2Enabled: boolean = false;
  private readonly localStorageDir: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const endpoint = this.configService.get<string>('R2_ENDPOINT');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucketName =
      this.configService.get<string>('R2_BUCKET_NAME') || 'catovoluntarios-documentos';
    this.bucketDocumentos = this.configService.get<string>('R2_DOCUMENTOS_BUCKET_NAME') || this.bucketName;
    this.publicUrl = (
      this.configService.get<string>('R2_PUBLIC_URL') || ''
    ).replace(/\/$/, '');

    // Directorio de respaldo local si R2 no está configurado aún
    this.localStorageDir = path.join(process.cwd(), 'uploads');

    const hasValidCredentials =
      Boolean(endpoint || accountId) &&
      Boolean(accessKeyId) &&
      Boolean(secretAccessKey) &&
      accessKeyId !== 'tu_r2_access_key_id' &&
      secretAccessKey !== 'tu_r2_secret_access_key' &&
      !accessKeyId?.includes('aqui');

    if (hasValidCredentials) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
          forcePathStyle: Boolean(endpoint),
          credentials: {
            accessKeyId: accessKeyId!,
            secretAccessKey: secretAccessKey!,
          },
        });
        this.isR2Enabled = true;
        this.logger.log(
          `☁️ Cloudflare R2 inicializado con éxito. Bucket: [${this.bucketName}].`,
        );
      } catch (error) {
        this.logger.error('❌ Error al inicializar cliente Cloudflare R2:', error);
      }
    } else {
      this.logger.warn(
        '⚠️ Cloudflare R2 no está configurado o tiene credenciales demo. Los archivos se almacenarán temporalmente en local (./uploads) sin interrumpir el funcionamiento.',
      );
    }
  }

  isConfigured(): boolean {
    return this.isR2Enabled && this.s3Client !== null;
  }

  /**
   * Sube un archivo a Cloudflare R2 (o almacenamiento local de respaldo)
   * Genera un identificador único y sanitiza el nombre para evitar path traversal o sobrescritura
   */
  async uploadFile(
    file: Express.Multer.File,
    folder = 'documentos',
    privado = false,
  ): Promise<UploadResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = privado ? 'documento' : path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .substring(0, 60);

    const uniqueId = crypto.randomUUID();
    const key = `${folder}/${Date.now()}-${uniqueId}-${safeBaseName}${ext}`;

    if (this.isConfigured() && this.s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: privado ? this.bucketDocumentos : this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype || 'application/octet-stream',
          Metadata: {
            ...(privado ? {} : { originalName: encodeURIComponent(file.originalname) }),
            uploadedAt: new Date().toISOString(),
          },
        });

        await this.s3Client.send(command);

        const fileUrl = privado ? `r2:${key}` : this.publicUrl
          ? `${this.publicUrl}/${key}`
          : `https://${this.bucketName}.r2.cloudflarestorage.com/${key}`;

        this.logger.log(`✅ Archivo subido exitosamente a R2: [${key}]`);

        return {
          url: fileUrl,
          key,
          nombreArchivo: file.originalname,
          tamanioBytes: file.size,
          mimeType: file.mimetype,
        };
      } catch (error) {
        this.logger.error(`❌ Error al subir archivo [${key}] a R2:`, error);
        throw new Error(`Error al subir el archivo al almacenamiento en la nube: ${error?.message || error}`);
      }
    }

    // Modo respaldo local si no hay credenciales R2 aún
    try {
      const directorio = privado ? path.join(process.cwd(), 'uploads-private') : this.localStorageDir;
      await fs.promises.mkdir(directorio, { recursive: true });
      const nombreLocal = `${uniqueId}-${safeBaseName}${ext}`;
      const localFilePath = path.join(directorio, nombreLocal);
      await fs.promises.writeFile(localFilePath, file.buffer);

      const localUrl = privado ? `privado:${nombreLocal}` : `/uploads/${nombreLocal}`;
      this.logger.log(`📁 Archivo almacenado localmente en respaldo: [${localFilePath}]`);

      return {
        url: localUrl,
        key: `local/${uniqueId}-${safeBaseName}${ext}`,
        nombreArchivo: file.originalname,
        tamanioBytes: file.size,
        mimeType: file.mimetype,
      };
    } catch (localError) {
      this.logger.error('❌ Error al guardar archivo en almacenamiento local:', localError);
      throw new Error('Error al procesar el archivo en el servidor.');
    }
  }

  async leerDocumento(referencia: string, userId: number): Promise<Buffer> {
    const archivoLocal = this.rutaLocal(referencia);
    if (archivoLocal) {
      try {
        return await fs.promises.readFile(archivoLocal);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    } else if (this.s3Client) {
      const key = this.claveR2(referencia);
      if (key?.startsWith(`documentos/usuario_${userId}/`)) {
        let objeto;
        try {
          objeto = await this.s3Client.send(new GetObjectCommand({ Bucket: this.bucketParaReferencia(referencia), Key: key }));
        } catch (error) {
          const codigo = (error as { name?: string; $metadata?: { httpStatusCode?: number } });
          if (codigo.name !== 'NoSuchKey' && codigo.$metadata?.httpStatusCode !== 404) throw error;
        }
        if (objeto?.Body) return Buffer.from(await objeto.Body.transformToByteArray());
      }
    }
    throw new NotFoundException('Archivo no disponible en el almacenamiento de documentos.');
  }

  async eliminarDocumento(referencia: string, userId: number) {
    const key = this.claveR2(referencia);
    if (this.rutaLocal(referencia) || key?.startsWith(`documentos/usuario_${userId}/`)) {
      return this.deleteFile(referencia);
    }
    return false;
  }

  private claveR2(referencia: string): string | undefined {
    const prefijoAnterior = `https://${this.bucketName}.r2.cloudflarestorage.com/`;
    if (referencia.startsWith('r2:')) return referencia.slice(3);
    if (this.publicUrl && referencia.startsWith(`${this.publicUrl}/`)) {
      return referencia.slice(this.publicUrl.length + 1);
    }
    if (referencia.startsWith(prefijoAnterior)) return referencia.slice(prefijoAnterior.length);
    return undefined;
  }

  private bucketParaReferencia(referencia: string) {
    return referencia.startsWith('r2:') ? this.bucketDocumentos : this.bucketName;
  }

  private rutaLocal(referencia: string): string | undefined {
    const match = /^(privado:|\/uploads\/|local\/)([a-zA-Z0-9._-]+)$/.exec(referencia);
    if (!match || match[2] === '.' || match[2] === '..') return undefined;
    const directorio = match[1] === 'privado:'
      ? path.join(process.cwd(), 'uploads-private')
      : this.localStorageDir;
    return path.join(directorio, match[2]);
  }

  /**
   * Elimina un archivo de Cloudflare R2 (o almacenamiento local)
   */
  async deleteFile(fileUrlOrKey: string): Promise<boolean> {
    if (!fileUrlOrKey) return true;

    // Extraer la clave S3 a partir de la URL o key
    const localPath = this.rutaLocal(fileUrlOrKey);
    const key = this.claveR2(fileUrlOrKey) ?? fileUrlOrKey;

    if (!localPath && this.s3Client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketParaReferencia(fileUrlOrKey),
          Key: key,
        });
        await this.s3Client.send(command);
        this.logger.log(`🗑️ Archivo eliminado de R2: [${key}]`);
        return true;
      } catch (error) {
        this.logger.error(`❌ Error al eliminar archivo [${key}] de R2:`, error);
        return false;
      }
    }

    if (!localPath) return false;
    try {
      await fs.promises.rm(localPath, { force: true });
      return true;
    } catch (err) {
      this.logger.warn(`No se pudo eliminar archivo local [${key}]:`, err);
      return false;
    }
  }
}
