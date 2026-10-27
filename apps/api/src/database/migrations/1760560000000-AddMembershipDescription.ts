import type { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMembershipDescription1760560000000 implements MigrationInterface {
  name = 'AddMembershipDescription1760560000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "membership" ADD "description" text')
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "membership" DROP COLUMN "description"')
  }
}
