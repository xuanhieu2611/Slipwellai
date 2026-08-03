-- Product decision: voice audio is transient. It is sent to the transcription
-- provider during submission and is never retained in Supabase Storage.
-- Voice captures without a completed transcript cannot be recovered, so remove
-- them together with their original audio rather than retain unusable metadata.
delete from public.captures
where source_type = 'voice'
  and (transcript_text is null or btrim(transcript_text) = '');

update public.captures
set original_text = transcript_text
where source_type = 'voice'
  and original_text is null;

alter table public.captures
  drop constraint if exists captures_source_content_check,
  drop constraint if exists captures_audio_metadata_check,
  alter column original_text set not null,
  drop column if exists audio_storage_path,
  drop column if exists audio_mime_type,
  drop column if exists audio_byte_size,
  drop column if exists audio_duration_ms,
  drop column if exists transcript_text;

drop policy if exists "users upload their own capture audio" on storage.objects;
drop policy if exists "users read their own capture audio" on storage.objects;
drop policy if exists "users delete their own capture audio" on storage.objects;

-- Supabase's storage trigger requires this transaction-local guard for a
-- version-controlled administrative cleanup of a known private bucket.
set local storage.allow_delete_query = 'true';
delete from storage.objects where bucket_id = 'capture-audio';
delete from storage.buckets where id = 'capture-audio';
