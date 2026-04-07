export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
  signedUrlExpiration?: number;
}

export interface S3ModuleOptions {
  /** Configuration for Amazon S3 provider. */
  aws?: S3Config;
  /** Configuration for MinIO provider. */
  minio?: S3Config;
  /** The preferred provider. */
  defaultProvider: string;
}
