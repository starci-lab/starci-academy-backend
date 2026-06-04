/**
 * Core lesson service — methods documented with Logic + Code.
 */
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
/**
 * Class `VaultService` — lesson lab component.
 */
export class VaultService {
  private static readonly logger = new Logger(VaultService.name);

  /**
   * Fetches the database password from HashiCorp Vault.
   * In a real system, this would use a proper Vault SDK and AppRole authentication.
   */
  static async fetchDatabasePassword(): Promise<string> {
    const vaultAddr = process.env.VAULT_ADDR || 'http://localhost:8200';
    const vaultToken = process.env.VAULT_TOKEN || 'root';

    try {
      this.logger.log(`Fetching secret from Vault at ${vaultAddr}/v1/secret/data/my-app...`);
      
      const response = await axios.get(`${vaultAddr}/v1/secret/data/my-app`, {
        headers: {
          'X-Vault-Token': vaultToken,
        },
      });

      // Vault KV v2 wraps data in `data.data`
      const password = response.data?.data?.data?.DB_PASSWORD;

      if (!password) {
        throw new Error('DB_PASSWORD not found in Vault secret.');
      }

      this.logger.log('Successfully retrieved DB_PASSWORD from Vault.');
      return password;
    } catch (error) {
      this.logger.error('Failed to fetch secret from Vault. Did you run `vault kv put secret/my-app DB_PASSWORD=...`?');
      throw error;
    }
  }
}
