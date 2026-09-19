param(
    [string]$TargetEmail = "cuongnvtse160875@gmail.com",
    [string]$PrimaryCourse = "fullstack-mastery",
    [string]$PostgresContainer = "starci-postgres",
    [string]$RedisContainer = "starci-redis"
)

$ErrorActionPreference = "Stop"
$seedFile = Join-Path $PSScriptRoot "learning-demo.sql"

if (-not (Test-Path -LiteralPath $seedFile)) {
    throw "Missing seed file: $seedFile"
}

$container = docker inspect $PostgresContainer --format "{{.Name}}" 2>$null
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($container)) {
    throw "PostgreSQL container is unavailable: $PostgresContainer"
}

$sql = Get-Content -LiteralPath $seedFile -Raw
$psqlCommand = 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v "target_email=$STARCI_SEED_EMAIL" -v "primary_course=$STARCI_SEED_COURSE"'
$sql | docker exec -i `
    -e "STARCI_SEED_EMAIL=$TargetEmail" `
    -e "STARCI_SEED_COURSE=$PrimaryCourse" `
    $PostgresContainer sh -lc $psqlCommand
if ($LASTEXITCODE -ne 0) {
    throw "Learning demo seed failed with exit code $LASTEXITCODE"
}

# A database rebuild can recreate the internal user UUID while preserving the
# Keycloak subject. Those identity and enrollment lookups have long-lived Redis
# entries; leaving them behind makes GraphQL and Socket.IO authorize the user as
# the deleted row even though PostgreSQL contains the new one. Invalidate only
# the seeded learner's cache entries so active sessions and unrelated dev data
# remain intact.
$identityCommand = 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -v "target_email=$STARCI_SEED_EMAIL" -At -F "|" -c "SELECT id, keycloak_id FROM users WHERE lower(email) = lower(:''target_email'') AND is_deleted = false LIMIT 1"'
$identity = docker exec `
    -e "STARCI_SEED_EMAIL=$TargetEmail" `
    $PostgresContainer sh -lc $identityCommand
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($identity)) {
    throw "Cannot resolve seeded learner identity for cache invalidation: $TargetEmail"
}

$identityParts = $identity.Trim().Split("|")
if ($identityParts.Count -ne 2) {
    throw "Unexpected seeded learner identity result"
}
$internalUserId = $identityParts[0]
$keycloakId = $identityParts[1]

$redisInspect = docker inspect $RedisContainer | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or $redisInspect.Count -eq 0) {
    throw "Redis container is unavailable: $RedisContainer"
}
$redisArguments = @($redisInspect[0].Config.Cmd)
$requirePassIndex = [Array]::IndexOf($redisArguments, "--requirepass")
if ($requirePassIndex -lt 0 -or $requirePassIndex + 1 -ge $redisArguments.Count) {
    throw "Redis requirepass argument is unavailable: $RedisContainer"
}
$redisPassword = $redisArguments[$requirePassIndex + 1]
$cacheKeys = @(
    "keyv::keyv:keycloak.user:$keycloakId",
    "keyv::keyv:user.enrolled-courses:$internalUserId"
)
docker exec `
    -e "REDISCLI_AUTH=$redisPassword" `
    $RedisContainer redis-cli DEL $cacheKeys | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "Learning demo cache invalidation failed with exit code $LASTEXITCODE"
}
