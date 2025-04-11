create type goal_type as enum ('meters', 'workouts');
create type goal_period as enum ('yearly', 'monthly', 'weekly');

create table goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type goal_type not null,
    period goal_period not null,
    target_value integer not null,
    start_date date not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, period)
);

-- Add RLS policies
alter table goals enable row level security;

create policy "Users can view their own goals"
    on goals for select
    using (auth.uid() = user_id);

create policy "Users can insert their own goals"
    on goals for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own goals"
    on goals for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
    on goals for delete
    using (auth.uid() = user_id); 