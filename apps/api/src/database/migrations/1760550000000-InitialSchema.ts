import type { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialSchema1760550000000 implements MigrationInterface {
  name = 'InitialSchema1760550000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('ADMIN', 'RECEPTION', 'COACH', 'CLIENT');
      CREATE TYPE "subscription_status" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');
      CREATE TYPE "payment_method" AS ENUM ('CARD', 'CASH', 'TRANSFER');
      CREATE TYPE "payment_status" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
      CREATE TYPE "muscle_group" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'ARMS', 'LEGS', 'GLUTES', 'CORE', 'CARDIO', 'FULL_BODY');
      CREATE TYPE "routine_level" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
      CREATE TYPE "assignment_status" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
    `)

    await queryRunner.query(`
      CREATE TABLE "client" (
        "id" SERIAL NOT NULL,
        "name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "dni" varchar(20) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "email" varchar(100),
        "stripe_customer_id" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_client_dni" UNIQUE ("dni"),
        CONSTRAINT "UQ_client_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_client_email" UNIQUE ("email"),
        CONSTRAINT "UQ_client_stripe_customer_id" UNIQUE ("stripe_customer_id"),
        CONSTRAINT "PK_client_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "coach" (
        "id" SERIAL NOT NULL,
        "name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "dni" varchar(20) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "email" varchar(100),
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "UQ_coach_dni" UNIQUE ("dni"),
        CONSTRAINT "UQ_coach_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_coach_email" UNIQUE ("email"),
        CONSTRAINT "PK_coach_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "membership" (
        "id" SERIAL NOT NULL,
        "name" varchar(50) NOT NULL,
        "duration_days" integer NOT NULL,
        "max_days_per_week" smallint,
        "price_amount" integer NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'usd',
        "stripe_product_id" varchar(255),
        "stripe_price_id" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "CHK_membership_duration_days" CHECK ("duration_days" > 0),
        CONSTRAINT "UQ_membership_name" UNIQUE ("name"),
        CONSTRAINT "UQ_membership_stripe_product_id" UNIQUE ("stripe_product_id"),
        CONSTRAINT "UQ_membership_stripe_price_id" UNIQUE ("stripe_price_id"),
        CONSTRAINT "PK_membership_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "stripe_event" (
        "id" varchar(255) NOT NULL,
        "type" varchar(100) NOT NULL,
        "payload" jsonb NOT NULL,
        "received_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "error" text,
        CONSTRAINT "PK_stripe_event_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "exercise" (
        "id" SERIAL NOT NULL,
        "name" varchar(100) NOT NULL,
        "muscle_group" "muscle_group" NOT NULL,
        "equipment" varchar(100),
        "description" text,
        CONSTRAINT "UQ_exercise_name" UNIQUE ("name"),
        CONSTRAINT "PK_exercise_id" PRIMARY KEY ("id")
      );
    `)

    await queryRunner.query(`
      CREATE TABLE "app_user" (
        "id" SERIAL NOT NULL,
        "email" varchar(100) NOT NULL,
        "password_hash" text NOT NULL,
        "role" "user_role" NOT NULL,
        "client_id" integer,
        "coach_id" integer,
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_app_user_email" UNIQUE ("email"),
        CONSTRAINT "UQ_app_user_client_id" UNIQUE ("client_id"),
        CONSTRAINT "UQ_app_user_coach_id" UNIQUE ("coach_id"),
        CONSTRAINT "CHK_app_user_owner" CHECK ("client_id" IS NULL OR "coach_id" IS NULL),
        CONSTRAINT "PK_app_user_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "coach_schedule" (
        "id" SERIAL NOT NULL,
        "coach_id" integer NOT NULL,
        "day_of_week" smallint NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        CONSTRAINT "CHK_coach_schedule_day_of_week" CHECK ("day_of_week" >= 1 AND "day_of_week" <= 7),
        CONSTRAINT "CHK_coach_schedule_time" CHECK ("start_time" < "end_time"),
        CONSTRAINT "UQ_coach_schedule_slot" UNIQUE ("coach_id", "day_of_week", "start_time"),
        CONSTRAINT "PK_coach_schedule_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "subscription" (
        "id" SERIAL NOT NULL,
        "client_id" integer NOT NULL,
        "membership_id" integer NOT NULL,
        "status" "subscription_status" NOT NULL DEFAULT 'PENDING',
        "start_date" date,
        "end_date" date,
        "stripe_subscription_id" varchar(255),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_subscription_stripe_subscription_id" UNIQUE ("stripe_subscription_id"),
        CONSTRAINT "PK_subscription_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "routine" (
        "id" SERIAL NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" text,
        "level" "routine_level" NOT NULL,
        "created_by" integer NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_routine_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "payment" (
        "id" SERIAL NOT NULL,
        "client_id" integer NOT NULL,
        "subscription_id" integer NOT NULL,
        "method" "payment_method" NOT NULL,
        "status" "payment_status" NOT NULL DEFAULT 'PENDING',
        "amount" integer NOT NULL,
        "currency" char(3) NOT NULL,
        "refunded_amount" integer NOT NULL DEFAULT 0,
        "stripe_checkout_session_id" varchar(255),
        "stripe_payment_intent_id" varchar(255),
        "stripe_invoice_id" varchar(255),
        "receipt_url" text,
        "recorded_by" integer,
        "paid_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_payment_refunded_amount" CHECK ("refunded_amount" <= "amount"),
        CONSTRAINT "UQ_payment_stripe_checkout_session_id" UNIQUE ("stripe_checkout_session_id"),
        CONSTRAINT "UQ_payment_stripe_payment_intent_id" UNIQUE ("stripe_payment_intent_id"),
        CONSTRAINT "UQ_payment_stripe_invoice_id" UNIQUE ("stripe_invoice_id"),
        CONSTRAINT "PK_payment_id" PRIMARY KEY ("id")
      );
    `)

    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id" SERIAL NOT NULL,
        "client_id" integer NOT NULL,
        "subscription_id" integer NOT NULL,
        "check_in_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "check_out_at" TIMESTAMP WITH TIME ZONE,
        "recorded_by" integer,
        CONSTRAINT "PK_attendance_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "routine_exercise" (
        "id" SERIAL NOT NULL,
        "routine_id" integer NOT NULL,
        "exercise_id" integer NOT NULL,
        "day_number" smallint NOT NULL,
        "position" smallint NOT NULL,
        "sets" smallint NOT NULL,
        "reps" smallint NOT NULL,
        "weight_kg" numeric(5,2),
        "rest_seconds" smallint,
        "notes" text,
        CONSTRAINT "CHK_routine_exercise_sets" CHECK ("sets" > 0),
        CONSTRAINT "CHK_routine_exercise_reps" CHECK ("reps" > 0),
        CONSTRAINT "UQ_routine_exercise_position" UNIQUE ("routine_id", "day_number", "position"),
        CONSTRAINT "PK_routine_exercise_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "client_routine" (
        "id" SERIAL NOT NULL,
        "client_id" integer NOT NULL,
        "routine_id" integer NOT NULL,
        "assigned_by" integer NOT NULL,
        "status" "assignment_status" NOT NULL DEFAULT 'ACTIVE',
        "start_date" date NOT NULL,
        "end_date" date,
        "notes" text,
        CONSTRAINT "PK_client_routine_id" PRIMARY KEY ("id")
      );
      CREATE TABLE "progress_record" (
        "id" SERIAL NOT NULL,
        "client_id" integer NOT NULL,
        "recorded_by" integer,
        "measured_at" date NOT NULL,
        "weight_kg" numeric(5,2),
        "height_cm" numeric(5,2),
        "body_fat_pct" numeric(4,1),
        "muscle_kg" numeric(5,2),
        "chest_cm" numeric(5,2),
        "waist_cm" numeric(5,2),
        "hip_cm" numeric(5,2),
        "arm_cm" numeric(5,2),
        "thigh_cm" numeric(5,2),
        "notes" text,
        CONSTRAINT "PK_progress_record_id" PRIMARY KEY ("id")
      );
    `)

    await queryRunner.query(`
      CREATE INDEX "IDX_subscription_client_status" ON "subscription" ("client_id", "status");
      CREATE INDEX "IDX_payment_client_id" ON "payment" ("client_id");
      CREATE INDEX "IDX_payment_subscription_id" ON "payment" ("subscription_id");
      CREATE INDEX "IDX_attendance_client_check_in" ON "attendance" ("client_id", "check_in_at");
      CREATE INDEX "IDX_client_routine_client_status" ON "client_routine" ("client_id", "status");
      CREATE INDEX "IDX_progress_record_client_measured_at" ON "progress_record" ("client_id", "measured_at");
      ALTER TABLE "app_user"
        ADD CONSTRAINT "FK_app_user_client" FOREIGN KEY ("client_id") REFERENCES "client" ("id");
      ALTER TABLE "app_user"
        ADD CONSTRAINT "FK_app_user_coach" FOREIGN KEY ("coach_id") REFERENCES "coach" ("id");
      ALTER TABLE "coach_schedule"
        ADD CONSTRAINT "FK_coach_schedule_coach" FOREIGN KEY ("coach_id") REFERENCES "coach" ("id");
      ALTER TABLE "subscription"
        ADD CONSTRAINT "FK_subscription_client" FOREIGN KEY ("client_id") REFERENCES "client" ("id");
      ALTER TABLE "subscription"
        ADD CONSTRAINT "FK_subscription_membership" FOREIGN KEY ("membership_id") REFERENCES "membership" ("id");
      ALTER TABLE "routine"
        ADD CONSTRAINT "FK_routine_coach" FOREIGN KEY ("created_by") REFERENCES "coach" ("id");
      ALTER TABLE "payment"
        ADD CONSTRAINT "FK_payment_client" FOREIGN KEY ("client_id") REFERENCES "client" ("id");
      ALTER TABLE "payment"
        ADD CONSTRAINT "FK_payment_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscription" ("id");
      ALTER TABLE "payment"
        ADD CONSTRAINT "FK_payment_user" FOREIGN KEY ("recorded_by") REFERENCES "app_user" ("id");
      ALTER TABLE "attendance"
        ADD CONSTRAINT "FK_attendance_client" FOREIGN KEY ("client_id") REFERENCES "client" ("id");
      ALTER TABLE "attendance"
        ADD CONSTRAINT "FK_attendance_subscription" FOREIGN KEY ("subscription_id") REFERENCES "subscription" ("id");
      ALTER TABLE "attendance"
        ADD CONSTRAINT "FK_attendance_user" FOREIGN KEY ("recorded_by") REFERENCES "app_user" ("id");
      ALTER TABLE "routine_exercise"
        ADD CONSTRAINT "FK_routine_exercise_routine" FOREIGN KEY ("routine_id") REFERENCES "routine" ("id");
      ALTER TABLE "routine_exercise"
        ADD CONSTRAINT "FK_routine_exercise_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercise" ("id");
      ALTER TABLE "client_routine"
        ADD CONSTRAINT "FK_client_routine_client" FOREIGN KEY ("client_id") REFERENCES "client" ("id");
      ALTER TABLE "client_routine"
        ADD CONSTRAINT "FK_client_routine_routine" FOREIGN KEY ("routine_id") REFERENCES "routine" ("id");
      ALTER TABLE "client_routine"
        ADD CONSTRAINT "FK_client_routine_coach" FOREIGN KEY ("assigned_by") REFERENCES "coach" ("id");
      ALTER TABLE "progress_record"
        ADD CONSTRAINT "FK_progress_record_client" FOREIGN KEY ("client_id") REFERENCES "client" ("id");
      ALTER TABLE "progress_record"
        ADD CONSTRAINT "FK_progress_record_coach" FOREIGN KEY ("recorded_by") REFERENCES "coach" ("id");
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "progress_record";
      DROP TABLE "client_routine";
      DROP TABLE "routine_exercise";
      DROP TABLE "attendance";
      DROP TABLE "payment";
      DROP TABLE "routine";
      DROP TABLE "subscription";
      DROP TABLE "coach_schedule";
      DROP TABLE "app_user";
      DROP TABLE "exercise";
      DROP TABLE "stripe_event";
      DROP TABLE "membership";
      DROP TABLE "coach";
      DROP TABLE "client";
      DROP TYPE "assignment_status";
      DROP TYPE "routine_level";
      DROP TYPE "muscle_group";
      DROP TYPE "payment_status";
      DROP TYPE "payment_method";
      DROP TYPE "subscription_status";
      DROP TYPE "user_role";
    `)
  }
}
