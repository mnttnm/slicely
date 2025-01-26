SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8
-- Dumped by pg_dump version 15.8

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '67f488e0-f266-48e3-843d-16d2fa43ac8d', '{"action":"user_signedup","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-01-23 18:43:41.454012+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c20c6cb0-9d43-427f-80fd-4452f56cebb6', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 06:47:48.99557+00', ''),
	('00000000-0000-0000-0000-000000000000', '02f4f055-cd99-46b0-ae6c-fde22fa00f08', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 06:48:03.863221+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb4962c0-63dc-465c-8e86-ef125c117795', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 06:48:47.732679+00', ''),
	('00000000-0000-0000-0000-000000000000', '649700f7-de55-490b-a64d-e729feab77d5', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:03:23.689554+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea53638e-a256-4ce8-bab6-2dacc2aa5ac2', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-01-26 07:03:24.245117+00', ''),
	('00000000-0000-0000-0000-000000000000', '05da2638-da5e-4b3b-8280-7f489282c5b3', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:07:04.117792+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd2147700-59f6-4c0b-ad6d-81df01371416', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:09:24.126707+00', ''),
	('00000000-0000-0000-0000-000000000000', '25767351-d4e7-40f5-970f-7a737beab362', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-01-26 07:09:24.51831+00', ''),
	('00000000-0000-0000-0000-000000000000', '9c53895a-74f9-473e-8e33-91c48b272a22', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:09:38.001908+00', ''),
	('00000000-0000-0000-0000-000000000000', '43df9d96-528c-4ba5-a215-6793556a62f9', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:14:22.389084+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ac549ab-2d72-4b71-9dd2-2749f0ad9e2a', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:26:23.635188+00', ''),
	('00000000-0000-0000-0000-000000000000', '1c7eacf9-64c7-4e75-a171-642a736d3a0b', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-01-26 07:26:23.998242+00', ''),
	('00000000-0000-0000-0000-000000000000', '65c4f902-0f8d-4720-ac07-feb178837425', '{"action":"logout","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-01-26 07:26:34.032752+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e644c552-6236-4e60-b692-49d8412a3804', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 07:26:42.433882+00', ''),
	('00000000-0000-0000-0000-000000000000', '526a5958-d251-4d8c-a8a0-5b05dd8c2a77', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-01-26 07:26:42.493209+00', ''),
	('00000000-0000-0000-0000-000000000000', '987ea866-a4b8-4f18-8f65-ff9d40c73449', '{"action":"logout","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-01-26 08:18:55.13596+00', ''),
	('00000000-0000-0000-0000-000000000000', '488d4f21-400e-4c3b-b887-2e965b77644c', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-01-26 08:18:58.652413+00', ''),
	('00000000-0000-0000-0000-000000000000', '0faa2b86-a7e7-4dd0-9974-db18f09b06f6', '{"action":"login","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-01-26 08:18:58.678247+00', ''),
	('00000000-0000-0000-0000-000000000000', 'acccd8fa-c7ad-48a6-8900-05f9d697cdb4', '{"action":"token_refreshed","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 09:38:57.530091+00', ''),
	('00000000-0000-0000-0000-000000000000', '13752911-7568-4ffa-8738-6d4870bdc6be', '{"action":"token_revoked","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 09:38:57.530792+00', ''),
	('00000000-0000-0000-0000-000000000000', '6db8d987-5d70-4670-bf4a-f3394c276574', '{"action":"token_refreshed","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 11:00:12.250814+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9c6ba27-83f9-446c-b84d-ceb023039b2c', '{"action":"token_revoked","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 11:00:12.251711+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a3b92175-09df-4e08-a177-146c1d58913e', '{"action":"token_refreshed","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 11:00:12.869366+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ae637b49-3b9f-46c5-8670-bdc20812cc4b', '{"action":"token_refreshed","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 11:00:13.527388+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bdea483c-58de-42e9-b578-8814cfb3c811', '{"action":"token_refreshed","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 11:00:13.548385+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd1292b79-0589-4d27-b2e7-82c954cca9c6', '{"action":"token_refreshed","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 12:51:01.287284+00', ''),
	('00000000-0000-0000-0000-000000000000', '99d3f187-04b7-4cc1-bea7-865de404e2c5', '{"action":"token_revoked","actor_id":"3693a5d6-a422-469a-b236-025f7dd40b35","actor_name":"Mohit Tater","actor_username":"mohittater.iiita@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-01-26 12:51:01.288411+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at") VALUES
	('67b14e59-62e4-48c1-9cdf-beab2e77e2db', '3693a5d6-a422-469a-b236-025f7dd40b35', 'f423c90e-bb79-4e01-afd9-8c52b380fe77', 's256', 'kZB_mth4G-5dOS6C8tGDJf9IxRhyvUWQ0SnK8nDhnbw', 'google', 'ya29.a0ARW5m74uMX5tL8rB7sx1Uy0G20FpjWZmRHRuScfK6YYrwpPhtIBqZ7prcRwt1kgI3ZFaX7H2kxC0P47fPIYjhzpFcZY0c3EKW7UXKnGX9d992eQT-ZpJJ7jqk46YOtQJmQRmTQ4nXBywEtYz1z4Lam05VBD8brDkXwaCgYKAXwSARASFQHGX2Mih6fOYnms2_3ccMvD8uGcmw0169', '', '2025-01-23 18:43:40.712111+00', '2025-01-23 18:43:41.456602+00', 'oauth', '2025-01-23 18:43:41.456582+00'),
	('8ceb097c-06ab-4b55-b845-bbbec4930d99', '3693a5d6-a422-469a-b236-025f7dd40b35', '584eec83-2a27-45e3-96f4-78239a9cd754', 's256', 'wGGWTGNbzJVbhNuGwRKFWJdlMcaJC8QSDSCBC2UVf_s', 'google', 'ya29.a0AXeO80Tt_wTI6w3SksZKSldl1C7qMgxIDpnfGH7kabQbXzFWEWEix9pF9mC_VziZ24-UOu-QDtI4xtA0-l9w_M0VHnt7ezrpUp9CMuvh2EEw10SjF2IrVcIoTWbSE8qrkZgmm89xDGYkRDQTJ2OnapspdXgXSYL2KzMaCgYKAZ0SARASFQHGX2MiHueJdGITvygjAiuxu0x1Fg0170', '', '2025-01-26 06:47:48.011064+00', '2025-01-26 06:47:48.997704+00', 'oauth', '2025-01-26 06:47:48.997668+00'),
	('309c0c25-25dc-414c-9fae-8d7e40e2f8fc', '3693a5d6-a422-469a-b236-025f7dd40b35', 'f377ee72-1933-45f0-b728-cc13ba153605', 's256', 'xc0PFZYKFuZZIVW4bEEe4qJpCuAOY_tgw6wEONyZQAk', 'google', 'ya29.a0AXeO80R9Nkt3aIZmoWM8YdtYc7uNH9oynzoGuHeEZRJ5N-Hm6AyhwMOvnMSe-UCsuHlXxRrahPto7vTqoBmOZ_8VIWi5yT0E2NoTlAyEHb6AjqQlunZ6faY555v6cFO-kr-bgfrB2kXZOs6Z_JakylikpFpeoP-lMG0aCgYKAdYSARASFQHGX2MiJGwS-hp9TQb-RMsT_dQKMw0170', '', '2025-01-26 06:48:03.444284+00', '2025-01-26 06:48:03.863716+00', 'oauth', '2025-01-26 06:48:03.863693+00'),
	('a27190e1-75f7-4d48-b6b5-515f4dabefda', '3693a5d6-a422-469a-b236-025f7dd40b35', '219db338-567f-40bf-83de-2739550af033', 's256', 'EuqZuhuRja5QBuVxg9sZHuoobYazD6NrGeaWSScLs-A', 'google', 'ya29.a0AXeO80R7LmMJkHXEIte6D670ngW5BXvS-xs9-XAmNDE_Zn4wRugaSprHzTU02eOm2W9TrmyCvt5ouKg80L42jOSVXT3wCuR5RID1Kv3QmyBEeVy5oXwFXcmwJk4y6nmAWGfhdVG5QFex42_3iMai6ljIAyt1QGor-rGdrFrJaCgYKAfQSARASFQHGX2Mie_2SjX0of1rmJsrdNKOqbQ0175', '', '2025-01-26 06:48:26.363846+00', '2025-01-26 06:48:47.733474+00', 'oauth', '2025-01-26 06:48:47.733431+00'),
	('60d79898-4ccd-4b3c-a69d-8f5b17585e70', '3693a5d6-a422-469a-b236-025f7dd40b35', '1c2494f1-1f0e-4e51-8224-bd00deaf9973', 's256', '0gMCuR_CtdomcC3FN5Cq8ELG8Nua43UDXeMIaiL-RRY', 'google', 'ya29.a0AXeO80Q4sek91aoW4zW_RZqUZFe9wY89YveN6znzmusaaBAA1EkGkxIBA_IQBNtEevTz18JdMq22RWBvLJm9GWI-kq2uuXIeu_Ier93jMNhjlC8gNg2_1KOhnLSTW8KR903JKK455Kpalu9112UbHf1a2PA4RxmQ8gaCgYKAS0SARASFQHGX2MiyNGhEdXQYGsodkcQX3rgPA0169', '', '2025-01-26 07:07:03.341462+00', '2025-01-26 07:07:04.118893+00', 'oauth', '2025-01-26 07:07:04.118845+00'),
	('2d3a5dd1-3524-4df3-a6c0-3b49f0a2147f', '3693a5d6-a422-469a-b236-025f7dd40b35', '33981f82-8a89-4520-9080-7def6d96351a', 's256', 'qtuSfOWjNg0KLQaI0CyEG8IfYvHU3WRJUv7pszzwszQ', 'google', 'ya29.a0AXeO80RG_IUgedsYs4BPMReGruRZxo7OBh0JnyCBrkU_aSCs--GDWIVCFyuKNOEdAMqzuxxZYciVKgY_2ix1v0avVzoEPVwWMOoJpUZZQE2o9Xppy52QQTd2iIgBtGGqxlPmaQTk5yrfJpKsSW0vfTRHNrIaCYOMfAaCgYKAbcSARASFQHGX2Mi2ZKOPu48ARWq_1LJ0MCrIA0169', '', '2025-01-26 07:09:37.433855+00', '2025-01-26 07:09:38.004272+00', 'oauth', '2025-01-26 07:09:38.004139+00'),
	('88d06da5-e19e-4f2f-8d57-821084a71795', '3693a5d6-a422-469a-b236-025f7dd40b35', '7a1a781a-1f81-4fa4-861c-d423ced1cb54', 's256', 'thQfa_YcYlCASMuGFmuTAZluI2JQmkZ2unUtJ56OXz8', 'google', 'ya29.a0AXeO80RIKJhUhwYpQOI3eyVRSV6VWMPs0VSLroJA5DgjULcbcayZfDUszKGaHHcxpqAoW1qwpoqpo0zdEhKuF0_w1Qg2UGTQ0jPRf9468VgadKPoxq0AZz6PXtuu6KiVBidWvvgidBUXZADIZtwDzS32npTOXjS78gaCgYKAT8SARASFQHGX2Mi4h4UEJt1ZfBBiAopTBXELw0169', '', '2025-01-26 07:14:21.511856+00', '2025-01-26 07:14:22.390723+00', 'oauth', '2025-01-26 07:14:22.39067+00'),
	('c25f480f-005a-4b6f-b04f-73e3f3cdb0a2', NULL, '9c4add9a-3fc0-47e3-899e-94114dfa0b69', 's256', 'ty_vewc7sdcY828ucUMFefR9ifxThpEgISdGvgpLUHU', 'google', '', '', '2025-01-26 07:21:02.760869+00', '2025-01-26 07:21:02.760869+00', 'oauth', NULL),
	('8c044fe9-c6b4-4da0-b5b9-031412dcbbbc', NULL, '35e15c9f-8ca5-4610-8814-2c8b5e84b73a', 's256', 'CSP5_xVUZ3fHL-2Lc5ZP0xuJB-O6GzBV2W0AklayytM', 'google', '', '', '2025-01-26 07:21:57.102883+00', '2025-01-26 07:21:57.102883+00', 'oauth', NULL),
	('576d72c6-64a8-4be1-bb48-4707df9588d1', NULL, 'f8bce55a-d199-4635-b4c7-467869a49d66', 's256', 'L_Qy7fFUmiovkG4h8HWsvmhi9Oidb-M9wqOfFiNt5NI', 'google', '', '', '2025-01-26 11:00:02.290336+00', '2025-01-26 11:00:02.290336+00', 'oauth', NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '3693a5d6-a422-469a-b236-025f7dd40b35', 'authenticated', 'authenticated', 'mohittater.iiita@gmail.com', NULL, '2025-01-23 18:43:41.455199+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-01-26 08:18:58.678924+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "105430673575258133133", "name": "Mohit Tater", "email": "mohittater.iiita@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocK61RVNnpAHXIzNrn7FZ15-HuHAmJe_WU7SQj8wvZ0fU43j6OrDZw=s96-c", "full_name": "Mohit Tater", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK61RVNnpAHXIzNrn7FZ15-HuHAmJe_WU7SQj8wvZ0fU43j6OrDZw=s96-c", "provider_id": "105430673575258133133", "email_verified": true, "phone_verified": false}', NULL, '2025-01-23 18:43:41.442217+00', '2025-01-26 12:51:01.290307+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('105430673575258133133', '3693a5d6-a422-469a-b236-025f7dd40b35', '{"iss": "https://accounts.google.com", "sub": "105430673575258133133", "name": "Mohit Tater", "email": "mohittater.iiita@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocK61RVNnpAHXIzNrn7FZ15-HuHAmJe_WU7SQj8wvZ0fU43j6OrDZw=s96-c", "full_name": "Mohit Tater", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocK61RVNnpAHXIzNrn7FZ15-HuHAmJe_WU7SQj8wvZ0fU43j6OrDZw=s96-c", "provider_id": "105430673575258133133", "email_verified": true, "phone_verified": false}', 'google', '2025-01-23 18:43:41.449186+00', '2025-01-23 18:43:41.449215+00', '2025-01-26 08:18:58.644117+00', 'ca9d2e43-a7ad-4ad5-9fe3-3d9c560e6ba3');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('1f33fb19-33e4-41a3-ba40-9b4fe324d490', '3693a5d6-a422-469a-b236-025f7dd40b35', '2025-01-26 08:18:58.678988+00', '2025-01-26 12:51:01.291484+00', NULL, 'aal1', NULL, '2025-01-26 12:51:01.291427', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', '192.168.65.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('1f33fb19-33e4-41a3-ba40-9b4fe324d490', '2025-01-26 08:18:58.685605+00', '2025-01-26 08:18:58.685605+00', 'oauth', '79e84d95-3e0f-4275-b63e-d6eb81de3e7f');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 37, 'g2Oy5soKX6cOMgwzKh0I5g', '3693a5d6-a422-469a-b236-025f7dd40b35', true, '2025-01-26 08:18:58.680026+00', '2025-01-26 09:38:57.531212+00', NULL, '1f33fb19-33e4-41a3-ba40-9b4fe324d490'),
	('00000000-0000-0000-0000-000000000000', 38, 'kxisRwC6vaz5EPRPW4UEww', '3693a5d6-a422-469a-b236-025f7dd40b35', true, '2025-01-26 09:38:57.532003+00', '2025-01-26 11:00:12.252452+00', 'g2Oy5soKX6cOMgwzKh0I5g', '1f33fb19-33e4-41a3-ba40-9b4fe324d490'),
	('00000000-0000-0000-0000-000000000000', 39, 'jr0V6qiushd7A_ha6X6MRw', '3693a5d6-a422-469a-b236-025f7dd40b35', true, '2025-01-26 11:00:12.253828+00', '2025-01-26 12:51:01.288859+00', 'kxisRwC6vaz5EPRPW4UEww', '1f33fb19-33e4-41a3-ba40-9b4fe324d490'),
	('00000000-0000-0000-0000-000000000000', 40, 'm5pzWAnv-SUnV12j8dfh9w', '3693a5d6-a422-469a-b236-025f7dd40b35', false, '2025-01-26 12:51:01.289339+00', '2025-01-26 12:51:01.289339+00', 'jr0V6qiushd7A_ha6X6MRw', '1f33fb19-33e4-41a3-ba40-9b4fe324d490');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: key; Type: TABLE DATA; Schema: pgsodium; Owner: supabase_admin
--



--
-- Data for Name: pdfs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pdfs" ("id", "file_name", "file_path", "file_processing_status", "is_template", "is_seeded_data", "created_at", "updated_at", "last_processed_at", "user_id") VALUES
	('2ee3f538-8b69-4c6e-b2c9-54cb6c90ba20', '199_SmoothQuant_Accurate_and_E.pdf', '3693a5d6-a422-469a-b236-025f7dd40b35/199_SmoothQuant_Accurate_and_E.pdf', 'pending', true, false, '2025-01-26 08:38:56.730734+00', '2025-01-26 08:38:56.730734+00', NULL, '3693a5d6-a422-469a-b236-025f7dd40b35');


--
-- Data for Name: slicers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."slicers" ("id", "name", "is_seeded_data", "description", "llm_prompts", "pdf_prompts", "processing_rules", "output_mode", "pdf_password", "webhook_url", "created_at", "updated_at", "user_id") VALUES
	('3bbdfab7-ef2c-4a8c-9a6a-66ed69a085ea', 'published paper summariser', false, 'Generate a one-liner summary of published PDF papers.', '[{"id": "54bd8b92-91e0-4e0d-a3ae-9c4e58200623", "prompt": "You are a skilled content writer; your task is to comprehend the text excerpt from the abstract section of the published conference paper and produce one-line summaries that encapsulate the essence of the paper."}]', '[]', '"{\"annotations\":[],\"pageSelection\":{\"strategy\":\"include\",\"rules\":[{\"type\":\"specific\",\"pages\":[1]}]}}"', NULL, NULL, NULL, '2025-01-26 08:42:23.412159+00', '2025-01-26 08:42:23.412159+00', '3693a5d6-a422-469a-b236-025f7dd40b35');


--
-- Data for Name: outputs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pdf_llm_outputs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: pdf_slicers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."pdf_slicers" ("id", "pdf_id", "slicer_id", "is_seeded_data", "user_id") VALUES
	('1963d471-8221-4b1f-b595-876cb6fc765d', '2ee3f538-8b69-4c6e-b2c9-54cb6c90ba20', '3bbdfab7-ef2c-4a8c-9a6a-66ed69a085ea', false, '3693a5d6-a422-469a-b236-025f7dd40b35');


--
-- Data for Name: slicer_llm_outputs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id") VALUES
	('slicely-pdfs', 'slicely-pdfs', NULL, '2025-01-26 08:26:35.444303+00', '2025-01-26 08:26:35.444303+00', false, false, NULL, NULL, NULL);


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('50dfaab4-2e36-4269-86ad-e7b10144be6f', 'slicely-pdfs', 'uploaded-pdfs/.emptyFolderPlaceholder', NULL, '2025-01-26 08:33:18.264917+00', '2025-01-26 08:33:18.264917+00', '2025-01-26 08:33:18.264917+00', '{"eTag": "\"d41d8cd98f00b204e9800998ecf8427e\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2025-01-26T08:33:18.257Z", "contentLength": 0, "httpStatusCode": 200}', '359ebc70-3937-4816-830b-3c84b084776e', NULL, '{}'),
	('ed2d4230-18c3-45a9-b153-68cdc6391755', 'slicely-pdfs', '3693a5d6-a422-469a-b236-025f7dd40b35/199_SmoothQuant_Accurate_and_E.pdf', '3693a5d6-a422-469a-b236-025f7dd40b35', '2025-01-26 08:38:56.683428+00', '2025-01-26 08:38:56.683428+00', '2025-01-26 08:38:56.683428+00', '{"eTag": "\"96b45d0870c6eb576e3d806ddd0f8f10\"", "size": 5203060, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2025-01-26T08:38:56.621Z", "contentLength": 5203060, "httpStatusCode": 200}', '6422d2d7-d80a-4350-b27f-6383e2fa6af7', '3693a5d6-a422-469a-b236-025f7dd40b35', '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 40, true);


--
-- Name: key_key_id_seq; Type: SEQUENCE SET; Schema: pgsodium; Owner: supabase_admin
--

SELECT pg_catalog.setval('"pgsodium"."key_key_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
