import { Injectable, ServiceUnavailableException, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Client } from 'minio';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const CONFIGURATION = ['MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET', 'MINIO_PUBLIC_URL'] as const;

@Injectable()
export class MediaService {
  private client?: Client;
  private bucketPret?: Promise<void>;

  constructor(private readonly config: ConfigService) {}

  async televerserImage(file: Express.Multer.File) {
    const extension = this.extensionValidee(file);
    if (file.size > MAX_IMAGE_BYTES) throw new UnsupportedMediaTypeException('L’image dépasse la limite de 8 Mo.');
    const client = this.clientMinio();
    const bucket = this.config.get<string>('MINIO_BUCKET')!;
    const publicBase = this.urlPublique();
    const key = `uploads/filieres/${randomUUID()}.${extension}`;

    await this.preparerBucket(client, bucket);
    try {
      await client.putObject(bucket, key, file.buffer, file.size, {
        'Content-Type': file.mimetype,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
    } catch {
      throw new ServiceUnavailableException('Le stockage des médias est temporairement indisponible.');
    }

    const cheminEncode = key.split('/').map(encodeURIComponent).join('/');
    return {
      url: `${publicBase}/${encodeURIComponent(bucket)}/${cheminEncode}`,
      key,
      type: file.mimetype,
      taille: file.size,
    };
  }

  private extensionValidee(file: Express.Multer.File) {
    if (!file?.buffer || !Buffer.isBuffer(file.buffer)) throw new UnsupportedMediaTypeException('Fichier image illisible.');
    const signature = file.buffer;
    const estJpeg = file.mimetype === 'image/jpeg' && signature.length >= 3 && signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
    const estPng = file.mimetype === 'image/png' && signature.length >= 8 && signature.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const estWebp = file.mimetype === 'image/webp' && signature.length >= 12 && signature.toString('ascii', 0, 4) === 'RIFF' && signature.toString('ascii', 8, 12) === 'WEBP';
    if (estJpeg) return 'jpg';
    if (estPng) return 'png';
    if (estWebp) return 'webp';
    throw new UnsupportedMediaTypeException('Formats autorisés : JPEG, PNG ou WebP valide.');
  }

  private clientMinio() {
    const manque = CONFIGURATION.filter((nom) => !this.config.get<string>(nom));
    if (manque.length) throw new ServiceUnavailableException(`Stockage média non configuré (${manque.join(', ')}).`);
    if (!this.client) {
      const port = Number(this.config.get<string>('MINIO_PORT') ?? '9000');
      if (!Number.isInteger(port) || port < 1 || port > 65535) throw new ServiceUnavailableException('Configuration du port MinIO invalide.');
      const endpoint = this.config.get<string>('MINIO_ENDPOINT')!;
      if (endpoint.includes('://') || endpoint.includes('/')) throw new ServiceUnavailableException('MINIO_ENDPOINT doit contenir uniquement le nom d’hôte, sans protocole ni chemin.');
      this.client = new Client({
        endPoint: endpoint,
        port,
        useSSL: this.config.get<string>('MINIO_USE_SSL') === 'true',
        accessKey: this.config.get<string>('MINIO_ACCESS_KEY')!,
        secretKey: this.config.get<string>('MINIO_SECRET_KEY')!,
      });
    }
    return this.client;
  }

  private urlPublique() {
    const raw = this.config.get<string>('MINIO_PUBLIC_URL')!;
    let url: URL;
    try { url = new URL(raw); }
    catch { throw new ServiceUnavailableException('MINIO_PUBLIC_URL doit être une URL absolue HTTP ou HTTPS.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new ServiceUnavailableException('MINIO_PUBLIC_URL doit être une URL de base HTTP(S) sans identifiants, paramètres ni fragment.');
    }
    if (this.config.get<string>('NODE_ENV') === 'production' && url.protocol !== 'https:') {
      throw new ServiceUnavailableException('MINIO_PUBLIC_URL doit utiliser HTTPS en production.');
    }
    return raw.replace(/\/+$/, '');
  }

  private async preparerBucket(client: Client, bucket: string) {
    if (!this.bucketPret) {
      this.bucketPret = (async () => {
        const exists = await client.bucketExists(bucket);
        if (!exists) await client.makeBucket(bucket);
        const policy = {
          Version: '2012-10-17',
          Statement: [{
            Sid: 'PublicReadFiliereImages',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/uploads/filieres/*`],
          }],
        };
        await client.setBucketPolicy(bucket, JSON.stringify(policy));
      })().catch((error) => {
        this.bucketPret = undefined;
        throw error;
      });
    }
    try { await this.bucketPret; }
    catch { throw new ServiceUnavailableException('Impossible de préparer le stockage média. Vérifiez les droits MinIO et le bucket.'); }
  }
}
