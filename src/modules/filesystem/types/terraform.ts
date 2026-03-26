/** Terraform-provisioned secrets mounted into the filesystem. */
export interface TerraformSecrets {
    s3SecretAccessKey: string
    keycloakClientSecret: string
}

