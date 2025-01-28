CREATE EXTENSION IF NOT EXISTS vector;

create table "public"."outputs" (
    "id" uuid not null default uuid_generate_v4(),
    "pdf_id" uuid not null,
    "slicer_id" uuid not null,
    "is_seeded_data" boolean not null default false,
    "page_number" integer not null,
    "text_content" text not null,
    "section_info" jsonb not null,
    "tsv" tsvector,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "user_id" uuid not null default auth.uid(),
    "embedding" vector(1536)
);


alter table "public"."outputs" enable row level security;

create table "public"."pdf_llm_outputs" (
    "id" uuid not null default uuid_generate_v4(),
    "pdf_id" uuid not null,
    "slicer_id" uuid not null,
    "is_seeded_data" boolean default false,
    "prompt" text not null,
    "prompt_id" text not null,
    "output" jsonb not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "user_id" uuid not null default auth.uid()
);


alter table "public"."pdf_llm_outputs" enable row level security;

create table "public"."pdf_slicers" (
    "id" uuid not null default uuid_generate_v4(),
    "pdf_id" uuid not null,
    "slicer_id" uuid not null,
    "is_seeded_data" boolean default false,
    "user_id" uuid not null default auth.uid()
);


alter table "public"."pdf_slicers" enable row level security;

create table "public"."pdfs" (
    "id" uuid not null default uuid_generate_v4(),
    "file_name" text not null,
    "file_path" text not null,
    "file_processing_status" text not null default 'pending'::text,
    "is_template" boolean default false,
    "is_seeded_data" boolean default false,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "last_processed_at" timestamp with time zone,
    "user_id" uuid not null default auth.uid()
);


alter table "public"."pdfs" enable row level security;

create table "public"."slicer_llm_outputs" (
    "id" uuid not null default uuid_generate_v4(),
    "slicer_id" uuid not null,
    "is_seeded_data" boolean default false,
    "prompt" text not null,
    "prompt_id" text not null,
    "output" jsonb not null,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "user_id" uuid not null default auth.uid()
);


alter table "public"."slicer_llm_outputs" enable row level security;

create table "public"."slicers" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "is_seeded_data" boolean default false,
    "description" text,
    "llm_prompts" jsonb,
    "pdf_prompts" jsonb,
    "processing_rules" jsonb,
    "output_mode" text,
    "pdf_password" text,
    "webhook_url" text,
    "created_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone default CURRENT_TIMESTAMP,
    "user_id" uuid not null default auth.uid()
);


alter table "public"."slicers" enable row level security;

CREATE INDEX outputs_embedding_idx ON public.outputs USING ivfflat (embedding vector_cosine_ops) WITH (lists='100');

CREATE UNIQUE INDEX outputs_pdf_slicer_page_unique ON public.outputs USING btree (pdf_id, slicer_id, page_number);

CREATE UNIQUE INDEX outputs_pkey ON public.outputs USING btree (id);

CREATE UNIQUE INDEX pdf_llm_outputs_pdf_slicer_prompt_unique ON public.pdf_llm_outputs USING btree (pdf_id, slicer_id, prompt_id);

CREATE UNIQUE INDEX pdf_llm_outputs_pkey ON public.pdf_llm_outputs USING btree (id);

CREATE UNIQUE INDEX pdf_slicers_pkey ON public.pdf_slicers USING btree (id);

CREATE UNIQUE INDEX pdfs_pkey ON public.pdfs USING btree (id);

CREATE UNIQUE INDEX slicer_llm_outputs_pkey ON public.slicer_llm_outputs USING btree (id);

CREATE UNIQUE INDEX slicer_llm_outputs_slicer_prompt_unique ON public.slicer_llm_outputs USING btree (slicer_id, prompt_id);

CREATE UNIQUE INDEX slicers_pkey ON public.slicers USING btree (id);

alter table "public"."outputs" add constraint "outputs_pkey" PRIMARY KEY using index "outputs_pkey";

alter table "public"."pdf_llm_outputs" add constraint "pdf_llm_outputs_pkey" PRIMARY KEY using index "pdf_llm_outputs_pkey";

alter table "public"."pdf_slicers" add constraint "pdf_slicers_pkey" PRIMARY KEY using index "pdf_slicers_pkey";

alter table "public"."pdfs" add constraint "pdfs_pkey" PRIMARY KEY using index "pdfs_pkey";

alter table "public"."slicer_llm_outputs" add constraint "slicer_llm_outputs_pkey" PRIMARY KEY using index "slicer_llm_outputs_pkey";

alter table "public"."slicers" add constraint "slicers_pkey" PRIMARY KEY using index "slicers_pkey";

alter table "public"."outputs" add constraint "outputs_pdf_id_fkey" FOREIGN KEY (pdf_id) REFERENCES pdfs(id) not valid;

alter table "public"."outputs" validate constraint "outputs_pdf_id_fkey";

alter table "public"."outputs" add constraint "outputs_pdf_slicer_page_unique" UNIQUE using index "outputs_pdf_slicer_page_unique";

alter table "public"."outputs" add constraint "outputs_slicer_id_fkey" FOREIGN KEY (slicer_id) REFERENCES slicers(id) not valid;

alter table "public"."outputs" validate constraint "outputs_slicer_id_fkey";

alter table "public"."outputs" add constraint "outputs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."outputs" validate constraint "outputs_user_id_fkey";

alter table "public"."pdf_llm_outputs" add constraint "pdf_llm_outputs_pdf_id_fkey" FOREIGN KEY (pdf_id) REFERENCES pdfs(id) not valid;

alter table "public"."pdf_llm_outputs" validate constraint "pdf_llm_outputs_pdf_id_fkey";

alter table "public"."pdf_llm_outputs" add constraint "pdf_llm_outputs_pdf_slicer_prompt_unique" UNIQUE using index "pdf_llm_outputs_pdf_slicer_prompt_unique";

alter table "public"."pdf_llm_outputs" add constraint "pdf_llm_outputs_slicer_id_fkey" FOREIGN KEY (slicer_id) REFERENCES slicers(id) not valid;

alter table "public"."pdf_llm_outputs" validate constraint "pdf_llm_outputs_slicer_id_fkey";

alter table "public"."pdf_llm_outputs" add constraint "pdf_llm_outputs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."pdf_llm_outputs" validate constraint "pdf_llm_outputs_user_id_fkey";

alter table "public"."pdf_slicers" add constraint "pdf_slicers_pdf_id_fkey" FOREIGN KEY (pdf_id) REFERENCES pdfs(id) not valid;

alter table "public"."pdf_slicers" validate constraint "pdf_slicers_pdf_id_fkey";

alter table "public"."pdf_slicers" add constraint "pdf_slicers_slicer_id_fkey" FOREIGN KEY (slicer_id) REFERENCES slicers(id) not valid;

alter table "public"."pdf_slicers" validate constraint "pdf_slicers_slicer_id_fkey";

alter table "public"."pdf_slicers" add constraint "pdf_slicers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."pdf_slicers" validate constraint "pdf_slicers_user_id_fkey";

alter table "public"."pdfs" add constraint "pdfs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."pdfs" validate constraint "pdfs_user_id_fkey";

alter table "public"."slicer_llm_outputs" add constraint "slicer_llm_outputs_slicer_id_fkey" FOREIGN KEY (slicer_id) REFERENCES slicers(id) not valid;

alter table "public"."slicer_llm_outputs" validate constraint "slicer_llm_outputs_slicer_id_fkey";

alter table "public"."slicer_llm_outputs" add constraint "slicer_llm_outputs_slicer_prompt_unique" UNIQUE using index "slicer_llm_outputs_slicer_prompt_unique";

alter table "public"."slicer_llm_outputs" add constraint "slicer_llm_outputs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."slicer_llm_outputs" validate constraint "slicer_llm_outputs_user_id_fkey";

alter table "public"."slicers" add constraint "slicers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."slicers" validate constraint "slicers_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.match_outputs(query_embedding vector, p_slicer_id uuid, match_threshold double precision DEFAULT 0.3, match_count integer DEFAULT 15)
 RETURNS TABLE(id uuid, text_content text, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    outputs.id,
    outputs.text_content,
    1 - (outputs.embedding <=> query_embedding) as similarity
  FROM outputs
  WHERE outputs.slicer_id = p_slicer_id
    AND outputs.embedding IS NOT NULL
    AND 1 - (outputs.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$
;

grant delete on table "public"."outputs" to "anon";

grant insert on table "public"."outputs" to "anon";

grant references on table "public"."outputs" to "anon";

grant select on table "public"."outputs" to "anon";

grant trigger on table "public"."outputs" to "anon";

grant truncate on table "public"."outputs" to "anon";

grant update on table "public"."outputs" to "anon";

grant delete on table "public"."outputs" to "authenticated";

grant insert on table "public"."outputs" to "authenticated";

grant references on table "public"."outputs" to "authenticated";

grant select on table "public"."outputs" to "authenticated";

grant trigger on table "public"."outputs" to "authenticated";

grant truncate on table "public"."outputs" to "authenticated";

grant update on table "public"."outputs" to "authenticated";

grant delete on table "public"."outputs" to "service_role";

grant insert on table "public"."outputs" to "service_role";

grant references on table "public"."outputs" to "service_role";

grant select on table "public"."outputs" to "service_role";

grant trigger on table "public"."outputs" to "service_role";

grant truncate on table "public"."outputs" to "service_role";

grant update on table "public"."outputs" to "service_role";

grant delete on table "public"."pdf_llm_outputs" to "anon";

grant insert on table "public"."pdf_llm_outputs" to "anon";

grant references on table "public"."pdf_llm_outputs" to "anon";

grant select on table "public"."pdf_llm_outputs" to "anon";

grant trigger on table "public"."pdf_llm_outputs" to "anon";

grant truncate on table "public"."pdf_llm_outputs" to "anon";

grant update on table "public"."pdf_llm_outputs" to "anon";

grant delete on table "public"."pdf_llm_outputs" to "authenticated";

grant insert on table "public"."pdf_llm_outputs" to "authenticated";

grant references on table "public"."pdf_llm_outputs" to "authenticated";

grant select on table "public"."pdf_llm_outputs" to "authenticated";

grant trigger on table "public"."pdf_llm_outputs" to "authenticated";

grant truncate on table "public"."pdf_llm_outputs" to "authenticated";

grant update on table "public"."pdf_llm_outputs" to "authenticated";

grant delete on table "public"."pdf_llm_outputs" to "service_role";

grant insert on table "public"."pdf_llm_outputs" to "service_role";

grant references on table "public"."pdf_llm_outputs" to "service_role";

grant select on table "public"."pdf_llm_outputs" to "service_role";

grant trigger on table "public"."pdf_llm_outputs" to "service_role";

grant truncate on table "public"."pdf_llm_outputs" to "service_role";

grant update on table "public"."pdf_llm_outputs" to "service_role";

grant delete on table "public"."pdf_slicers" to "anon";

grant insert on table "public"."pdf_slicers" to "anon";

grant references on table "public"."pdf_slicers" to "anon";

grant select on table "public"."pdf_slicers" to "anon";

grant trigger on table "public"."pdf_slicers" to "anon";

grant truncate on table "public"."pdf_slicers" to "anon";

grant update on table "public"."pdf_slicers" to "anon";

grant delete on table "public"."pdf_slicers" to "authenticated";

grant insert on table "public"."pdf_slicers" to "authenticated";

grant references on table "public"."pdf_slicers" to "authenticated";

grant select on table "public"."pdf_slicers" to "authenticated";

grant trigger on table "public"."pdf_slicers" to "authenticated";

grant truncate on table "public"."pdf_slicers" to "authenticated";

grant update on table "public"."pdf_slicers" to "authenticated";

grant delete on table "public"."pdf_slicers" to "service_role";

grant insert on table "public"."pdf_slicers" to "service_role";

grant references on table "public"."pdf_slicers" to "service_role";

grant select on table "public"."pdf_slicers" to "service_role";

grant trigger on table "public"."pdf_slicers" to "service_role";

grant truncate on table "public"."pdf_slicers" to "service_role";

grant update on table "public"."pdf_slicers" to "service_role";

grant delete on table "public"."pdfs" to "anon";

grant insert on table "public"."pdfs" to "anon";

grant references on table "public"."pdfs" to "anon";

grant select on table "public"."pdfs" to "anon";

grant trigger on table "public"."pdfs" to "anon";

grant truncate on table "public"."pdfs" to "anon";

grant update on table "public"."pdfs" to "anon";

grant delete on table "public"."pdfs" to "authenticated";

grant insert on table "public"."pdfs" to "authenticated";

grant references on table "public"."pdfs" to "authenticated";

grant select on table "public"."pdfs" to "authenticated";

grant trigger on table "public"."pdfs" to "authenticated";

grant truncate on table "public"."pdfs" to "authenticated";

grant update on table "public"."pdfs" to "authenticated";

grant delete on table "public"."pdfs" to "service_role";

grant insert on table "public"."pdfs" to "service_role";

grant references on table "public"."pdfs" to "service_role";

grant select on table "public"."pdfs" to "service_role";

grant trigger on table "public"."pdfs" to "service_role";

grant truncate on table "public"."pdfs" to "service_role";

grant update on table "public"."pdfs" to "service_role";

grant delete on table "public"."slicer_llm_outputs" to "anon";

grant insert on table "public"."slicer_llm_outputs" to "anon";

grant references on table "public"."slicer_llm_outputs" to "anon";

grant select on table "public"."slicer_llm_outputs" to "anon";

grant trigger on table "public"."slicer_llm_outputs" to "anon";

grant truncate on table "public"."slicer_llm_outputs" to "anon";

grant update on table "public"."slicer_llm_outputs" to "anon";

grant delete on table "public"."slicer_llm_outputs" to "authenticated";

grant insert on table "public"."slicer_llm_outputs" to "authenticated";

grant references on table "public"."slicer_llm_outputs" to "authenticated";

grant select on table "public"."slicer_llm_outputs" to "authenticated";

grant trigger on table "public"."slicer_llm_outputs" to "authenticated";

grant truncate on table "public"."slicer_llm_outputs" to "authenticated";

grant update on table "public"."slicer_llm_outputs" to "authenticated";

grant delete on table "public"."slicer_llm_outputs" to "service_role";

grant insert on table "public"."slicer_llm_outputs" to "service_role";

grant references on table "public"."slicer_llm_outputs" to "service_role";

grant select on table "public"."slicer_llm_outputs" to "service_role";

grant trigger on table "public"."slicer_llm_outputs" to "service_role";

grant truncate on table "public"."slicer_llm_outputs" to "service_role";

grant update on table "public"."slicer_llm_outputs" to "service_role";

grant delete on table "public"."slicers" to "anon";

grant insert on table "public"."slicers" to "anon";

grant references on table "public"."slicers" to "anon";

grant select on table "public"."slicers" to "anon";

grant trigger on table "public"."slicers" to "anon";

grant truncate on table "public"."slicers" to "anon";

grant update on table "public"."slicers" to "anon";

grant delete on table "public"."slicers" to "authenticated";

grant insert on table "public"."slicers" to "authenticated";

grant references on table "public"."slicers" to "authenticated";

grant select on table "public"."slicers" to "authenticated";

grant trigger on table "public"."slicers" to "authenticated";

grant truncate on table "public"."slicers" to "authenticated";

grant update on table "public"."slicers" to "authenticated";

grant delete on table "public"."slicers" to "service_role";

grant insert on table "public"."slicers" to "service_role";

grant references on table "public"."slicers" to "service_role";

grant select on table "public"."slicers" to "service_role";

grant trigger on table "public"."slicers" to "service_role";

grant truncate on table "public"."slicers" to "service_role";

grant update on table "public"."slicers" to "service_role";

create policy "modify_own_data"
on "public"."outputs"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "read_policy"
on "public"."outputs"
as permissive
for select
to public
using (((is_seeded_data = true) OR (user_id = auth.uid())));


create policy "modify_own_data"
on "public"."pdf_llm_outputs"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "read_policy"
on "public"."pdf_llm_outputs"
as permissive
for select
to public
using (((is_seeded_data = true) OR (user_id = auth.uid())));


create policy "modify_own_data"
on "public"."pdf_slicers"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "read_policy"
on "public"."pdf_slicers"
as permissive
for select
to public
using (((is_seeded_data = true) OR (user_id = auth.uid())));


create policy "modify_own_data"
on "public"."pdfs"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "read_policy"
on "public"."pdfs"
as permissive
for select
to public
using (((is_seeded_data = true) OR (user_id = auth.uid())));


create policy "modify_own_data"
on "public"."slicer_llm_outputs"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "read_policy"
on "public"."slicer_llm_outputs"
as permissive
for select
to public
using (((is_seeded_data = true) OR (user_id = auth.uid())));


create policy "modify_own_data"
on "public"."slicers"
as permissive
for all
to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


create policy "read_policy"
on "public"."slicers"
as permissive
for select
to public
using (((is_seeded_data = true) OR (user_id = auth.uid())));



create policy "Give users access to own folder 1thbprj_0"
on "storage"."objects"
as permissive
for select
to public
using ((((bucket_id = 'slicely-pdfs'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])) OR ((storage.foldername(name))[1] = '3693a5d6-a422-469a-b236-025f7dd40b35'::text)));


create policy "Give users access to own folder 1thbprj_1"
on "storage"."objects"
as permissive
for insert
to public
with check ((((bucket_id = 'slicely-pdfs'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])) OR ((storage.foldername(name))[1] = '3693a5d6-a422-469a-b236-025f7dd40b35'::text)));


create policy "Give users access to own folder 1thbprj_2"
on "storage"."objects"
as permissive
for update
to public
using ((((bucket_id = 'slicely-pdfs'::text) AND (( SELECT (auth.uid())::text AS uid) = (storage.foldername(name))[1])) OR ((storage.foldername(name))[1] = '3693a5d6-a422-469a-b236-025f7dd40b35'::text)));



