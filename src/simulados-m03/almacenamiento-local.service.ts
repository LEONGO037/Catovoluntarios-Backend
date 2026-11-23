/**
 * ⚠ TEMPORAL (M03) — Reemplazar por el almacenamiento en Cloudflare R2.
 *
 * init.sql espera en `informe_pdf_url` un enlace de R2. Mientras no existan
 * credenciales, los PDF se guardan en ./uploads y se registra una referencia
 * `local:<ruta>` que solo puede leerse mediante un endpoint protegido.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

const PREFIJO = 'local:';

@Injectable()
export class AlmacenamientoLocalService {
  private readonly raiz = path.resolve(process.cwd(), 'uploads');

  async guardar(carpeta: string, nombreArchivo: string, contenido: Buffer): Promise<string> {
    const relativa = path.posix.join(carpeta, nombreArchivo);
    const destino = this.rutaSegura(relativa);
    await fs.mkdir(path.dirname(destino), { recursive: true });
    await fs.writeFile(destino, contenido);
    return `${PREFIJO}${relativa}`;
  }

  async leer(referencia: string): Promise<Buffer> {
    if (!referencia.startsWith(PREFIJO)) {
      throw new NotFoundException('El informe no está en el almacenamiento local');
    }
    const destino = this.rutaSegura(referencia.slice(PREFIJO.length));
    try {
      return await fs.readFile(destino);
    } catch {
      throw new NotFoundException('Archivo de informe no encontrado');
    }
  }

  /** Evita salir de ./uploads con rutas relativas maliciosas. */
  private rutaSegura(relativa: string): string {
    const destino = path.resolve(this.raiz, relativa);
    if (!destino.startsWith(this.raiz + path.sep)) {
      throw new NotFoundException('Ruta de archivo no válida');
    }
    return destino;
  }
}
