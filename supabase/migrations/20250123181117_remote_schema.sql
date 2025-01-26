

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."continents" AS ENUM (
    'Africa',
    'Antarctica',
    'Asia',
    'Europe',
    'Oceania',
    'North America',
    'South America'
);


ALTER TYPE "public"."continents" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."countries" (
    "id" bigint NOT NULL,
    "name" "text",
    "iso2" "text" NOT NULL,
    "iso3" "text",
    "local_name" "text",
    "continent" "public"."continents"
);


ALTER TABLE "public"."countries" OWNER TO "postgres";


COMMENT ON TABLE "public"."countries" IS 'Full list of countries.';



COMMENT ON COLUMN "public"."countries"."name" IS 'Full country name.';



COMMENT ON COLUMN "public"."countries"."iso2" IS 'ISO 3166-1 alpha-2 code.';



COMMENT ON COLUMN "public"."countries"."iso3" IS 'ISO 3166-1 alpha-3 code.';



COMMENT ON COLUMN "public"."countries"."local_name" IS 'Local variation of the name.';



ALTER TABLE "public"."countries" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."countries_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."outputs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pdf_id" "uuid" NOT NULL,
    "slicer_id" "uuid" NOT NULL,
    "is_seeded_data" boolean DEFAULT false,
    "page_number" integer NOT NULL,
    "text_content" "text" NOT NULL,
    "section_info" "jsonb" NOT NULL,
    "embedding" "text",
    "tsv" "tsvector",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."outputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdf_llm_outputs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pdf_id" "uuid" NOT NULL,
    "slicer_id" "uuid" NOT NULL,
    "is_seeded_data" boolean DEFAULT false,
    "prompt" "text" NOT NULL,
    "prompt_id" "text" NOT NULL,
    "output" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."pdf_llm_outputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdf_slicers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "pdf_id" "uuid" NOT NULL,
    "slicer_id" "uuid" NOT NULL,
    "is_seeded_data" boolean DEFAULT false,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."pdf_slicers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pdfs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_processing_status" "text" DEFAULT 'pending'::"text",
    "is_template" boolean DEFAULT false,
    "is_seeded_data" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "last_processed_at" timestamp with time zone,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."pdfs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slicer_llm_outputs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slicer_id" "uuid",
    "is_seeded_data" boolean DEFAULT false,
    "prompt" "text" NOT NULL,
    "prompt_id" "text" NOT NULL,
    "output" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."slicer_llm_outputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."slicers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "is_seeded_data" boolean DEFAULT false,
    "description" "text",
    "llm_prompts" "jsonb",
    "pdf_prompts" "jsonb",
    "processing_rules" "jsonb",
    "output_mode" "text",
    "pdf_password" "text",
    "webhook_url" "text",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."slicers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."countries"
    ADD CONSTRAINT "countries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outputs"
    ADD CONSTRAINT "outputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdf_llm_outputs"
    ADD CONSTRAINT "pdf_llm_outputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdf_slicers"
    ADD CONSTRAINT "pdf_slicers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pdfs"
    ADD CONSTRAINT "pdfs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slicer_llm_outputs"
    ADD CONSTRAINT "slicer_llm_outputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."slicers"
    ADD CONSTRAINT "slicers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."outputs"
    ADD CONSTRAINT "outputs_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id");



ALTER TABLE ONLY "public"."outputs"
    ADD CONSTRAINT "outputs_slicer_id_fkey" FOREIGN KEY ("slicer_id") REFERENCES "public"."slicers"("id");



ALTER TABLE ONLY "public"."outputs"
    ADD CONSTRAINT "outputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pdf_llm_outputs"
    ADD CONSTRAINT "pdf_llm_outputs_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id");



ALTER TABLE ONLY "public"."pdf_llm_outputs"
    ADD CONSTRAINT "pdf_llm_outputs_slicer_id_fkey" FOREIGN KEY ("slicer_id") REFERENCES "public"."slicers"("id");



ALTER TABLE ONLY "public"."pdf_llm_outputs"
    ADD CONSTRAINT "pdf_llm_outputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pdf_slicers"
    ADD CONSTRAINT "pdf_slicers_pdf_id_fkey" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdfs"("id");



ALTER TABLE ONLY "public"."pdf_slicers"
    ADD CONSTRAINT "pdf_slicers_slicer_id_fkey" FOREIGN KEY ("slicer_id") REFERENCES "public"."slicers"("id");



ALTER TABLE ONLY "public"."pdf_slicers"
    ADD CONSTRAINT "pdf_slicers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pdfs"
    ADD CONSTRAINT "pdfs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."slicer_llm_outputs"
    ADD CONSTRAINT "slicer_llm_outputs_slicer_id_fkey" FOREIGN KEY ("slicer_id") REFERENCES "public"."slicers"("id");



ALTER TABLE ONLY "public"."slicer_llm_outputs"
    ADD CONSTRAINT "slicer_llm_outputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."slicers"
    ADD CONSTRAINT "slicers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Users can access seeded data or own data" ON "public"."outputs" USING ((("is_seeded_data" = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can access seeded data or own data" ON "public"."pdf_llm_outputs" USING ((("is_seeded_data" = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can access seeded data or own data" ON "public"."pdf_slicers" USING ((("is_seeded_data" = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can access seeded data or own data" ON "public"."pdfs" USING ((("is_seeded_data" = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can access seeded data or own data" ON "public"."slicer_llm_outputs" USING ((("is_seeded_data" = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can access seeded data or own data" ON "public"."slicers" USING ((("is_seeded_data" = true) OR ("user_id" = "auth"."uid"())));



ALTER TABLE "public"."outputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdf_llm_outputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdf_slicers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pdfs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slicer_llm_outputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."slicers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."countries" TO "anon";
GRANT ALL ON TABLE "public"."countries" TO "authenticated";
GRANT ALL ON TABLE "public"."countries" TO "service_role";



GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."countries_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."outputs" TO "anon";
GRANT ALL ON TABLE "public"."outputs" TO "authenticated";
GRANT ALL ON TABLE "public"."outputs" TO "service_role";



GRANT ALL ON TABLE "public"."pdf_llm_outputs" TO "anon";
GRANT ALL ON TABLE "public"."pdf_llm_outputs" TO "authenticated";
GRANT ALL ON TABLE "public"."pdf_llm_outputs" TO "service_role";



GRANT ALL ON TABLE "public"."pdf_slicers" TO "anon";
GRANT ALL ON TABLE "public"."pdf_slicers" TO "authenticated";
GRANT ALL ON TABLE "public"."pdf_slicers" TO "service_role";



GRANT ALL ON TABLE "public"."pdfs" TO "anon";
GRANT ALL ON TABLE "public"."pdfs" TO "authenticated";
GRANT ALL ON TABLE "public"."pdfs" TO "service_role";



GRANT ALL ON TABLE "public"."slicer_llm_outputs" TO "anon";
GRANT ALL ON TABLE "public"."slicer_llm_outputs" TO "authenticated";
GRANT ALL ON TABLE "public"."slicer_llm_outputs" TO "service_role";



GRANT ALL ON TABLE "public"."slicers" TO "anon";
GRANT ALL ON TABLE "public"."slicers" TO "authenticated";
GRANT ALL ON TABLE "public"."slicers" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
