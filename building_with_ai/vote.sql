create or replace function vote(poll_id bigint, option_text text) returns void as $$
begin
  update polls
  set options = (
    select jsonb_agg(
      case
        when (elem->>'text') = option_text then jsonb_set(elem, '{votes}', ((elem->>'votes')::int + 1)::text::jsonb)
        else elem
      end
    )
    from jsonb_array_elements(options) as elem
  )
  where id = poll_id;
end;
$$ language plpgsql;
