import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddRefreshTokens1763000000000 implements MigrationInterface {
  name = 'AddRefreshTokens1763000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_token" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "replaced_by_id" integer,
        "user_agent" text,
        "ip" varchar(45),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_refresh_token_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "PK_refresh_token_id" PRIMARY KEY ("id")
      );
      CREATE INDEX "IDX_refresh_token_user_id" ON "refresh_token" ("user_id");
      CREATE INDEX "IDX_refresh_token_expires_at" ON "refresh_token" ("expires_at");
      ALTER TABLE "refresh_token"
        ADD CONSTRAINT "FK_refresh_token_user" FOREIGN KEY ("user_id") REFERENCES "app_user" ("id") ON DELETE CASCADE;
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "refresh_token"')
  }
}
