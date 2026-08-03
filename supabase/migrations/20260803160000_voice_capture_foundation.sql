-- Phase 0 voice-capture foundation. This is additive: existing text captures
-- keep their original text source while voice captures retain a private audio path.
alter type public.capture_status add value if not exists 'uploading';
alter type public.capture_status add value if not exists 'transcribing';

alter table public.captures
  alter column original_text drop not null,
  add column if not exists source_type text not null default 'text' check (source_type in ('text', 'voice')),
  add column if not exists audio_storage_path text,
  add column if not exists audio_mime_type text,
  add column if not exists audio_byte_size integer,
  add column if not exists audio_duration_ms integer,
  add column if not exists transcript_text text,
  add column if not exists transcription_model text,
  add column if not exists transcription_latency_ms integer check (transcription_latency_ms is null or transcription_latency_ms >= 0),
  add column if not exists transcription_estimated_cost_microunits bigint check (transcription_estimated_cost_microunits is null or transcription_estimated_cost_microunits >= 0),
  add constraint captures_source_content_check check (
    (source_type = 'text' and original_text is not null and audio_storage_path is null)
    or (source_type = 'voice' and original_text is null and audio_storage_path is not null)
  ),
  add constraint captures_audio_metadata_check check (
    source_type = 'text'
    or (audio_mime_type in ('audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg')
      and audio_byte_size between 1 and 26214400
      and audio_duration_ms between 1 and 300000)
  );

create index if not exists captures_owner_source_created_idx on public.captures (owner_id, source_type, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'capture-audio',
  'capture-audio',
  false,
  26214400,
  array['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload their own capture audio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'capture-audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users read their own capture audio" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'capture-audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "users delete their own capture audio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'capture-audio'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
