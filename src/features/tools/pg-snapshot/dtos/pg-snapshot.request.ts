import {
    ApiProperty,
} from "@nestjs/swagger"
import {
    ArrayMinSize,
    IsArray,
    IsNotEmpty,
    IsString,
    ValidateNested,
} from "class-validator"
import {
    Type,
} from "class-transformer"

/**
 * One database target in a snapshot request.
 */
export class PgSnapshotTargetDto {
    @ApiProperty({
        description: "Operator-facing label; slugified into the dump filename.",
        example: "prod-primary",
    })
    @IsString()
    @IsNotEmpty()
        name: string

    @ApiProperty({
        description: "Full PostgreSQL connection URL of the database to dump.",
        example: "postgres://user:pass@db.example.com:5432/app",
    })
    @IsString()
    @IsNotEmpty()
        url: string
}

/**
 * Request DTO for dumping a list of cloud databases to local files.
 */
export class PgSnapshotRequest {
    @ApiProperty({
        description: "The list of cloud databases to snapshot.",
        type: [PgSnapshotTargetDto],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({
        each: true,
    })
    @Type(() => PgSnapshotTargetDto)
        targets: Array<PgSnapshotTargetDto>
}
