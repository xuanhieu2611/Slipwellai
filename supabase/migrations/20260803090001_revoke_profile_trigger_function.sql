-- The profile trigger runs under the auth table owner. It is not a public RPC.
revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
