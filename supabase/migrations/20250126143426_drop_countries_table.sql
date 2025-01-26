revoke delete on table "public"."countries" from "anon";

revoke insert on table "public"."countries" from "anon";

revoke references on table "public"."countries" from "anon";

revoke select on table "public"."countries" from "anon";

revoke trigger on table "public"."countries" from "anon";

revoke truncate on table "public"."countries" from "anon";

revoke update on table "public"."countries" from "anon";

revoke delete on table "public"."countries" from "authenticated";

revoke insert on table "public"."countries" from "authenticated";

revoke references on table "public"."countries" from "authenticated";

revoke select on table "public"."countries" from "authenticated";

revoke trigger on table "public"."countries" from "authenticated";

revoke truncate on table "public"."countries" from "authenticated";

revoke update on table "public"."countries" from "authenticated";

revoke delete on table "public"."countries" from "service_role";

revoke insert on table "public"."countries" from "service_role";

revoke references on table "public"."countries" from "service_role";

revoke select on table "public"."countries" from "service_role";

revoke trigger on table "public"."countries" from "service_role";

revoke truncate on table "public"."countries" from "service_role";

revoke update on table "public"."countries" from "service_role";

alter table "public"."countries" drop constraint "countries_pkey";

drop index if exists "public"."countries_pkey";

drop table "public"."countries";


