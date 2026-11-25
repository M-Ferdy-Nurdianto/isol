-- Remove unused cheki_custom_options config entry
DELETE FROM public.config WHERE key = 'cheki_custom_options';
