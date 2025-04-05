import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { Select, NumberInput, Button, Stack, Title, Alert } from '@mantine/core';
import { useSupabase } from '../hooks/useSupabase';
import { useState, useEffect } from 'react';

type GoalType = 'meters' | 'workouts';
type GoalPeriod = 'yearly' | 'monthly' | 'weekly';

interface GoalFormValues {
  type: GoalType;
  period: GoalPeriod;
  targetValue: number;
  startDate: Date;
}

interface GoalFormProps {
  editingGoalId?: string | null;
  onSuccess?: () => void;
}

export function GoalForm({ editingGoalId, onSuccess }: GoalFormProps) {
  const { supabase } = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<GoalFormValues>({
    initialValues: {
      type: 'meters',
      period: 'weekly',
      targetValue: 10000,
      startDate: new Date(),
    },
    validate: {
      targetValue: (value) => (value <= 0 ? 'Target value must be positive' : null),
      startDate: (value) => (!value ? 'Start date is required' : null),
    },
  });

  useEffect(() => {
    if (editingGoalId) {
      fetchGoal();
    }
  }, [editingGoalId]);

  const fetchGoal = async () => {
    if (!editingGoalId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('id', editingGoalId)
        .single();

      if (error) throw error;

      if (data) {
        form.setValues({
          type: data.type,
          period: data.period,
          targetValue: data.target_value,
          startDate: new Date(data.start_date),
        });
      }
    } catch (error) {
      console.error('Error fetching goal:', error);
      setError('Failed to load goal data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: GoalFormValues) => {
    try {
      setError(null);
      setSuccess(null);

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to create goals');
        return;
      }

      const goalData = {
        user_id: user.id,
        type: values.type,
        period: values.period,
        target_value: values.targetValue,
        start_date: values.startDate.toISOString().split('T')[0],
      };

      let error;
      if (editingGoalId) {
        ({ error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', editingGoalId));
      } else {
        ({ error } = await supabase
          .from('goals')
          .insert(goalData));
      }

      if (error) {
        if (error.code === '23505') { // Unique violation
          setError(`You already have a ${values.period} goal set. Please delete or update the existing one.`);
        } else {
          setError(error.message);
        }
        return;
      }
      
      setSuccess('Goal saved successfully!');
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error saving goal:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading goal data...</div>;
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        {!editingGoalId && <Title order={2}>Create New Goal</Title>}

        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" title="Success">
            {success}
          </Alert>
        )}
        
        <Select
          label="Goal Type"
          description="What do you want to track?"
          data={[
            { value: 'meters', label: 'Distance (meters)' },
            { value: 'workouts', label: 'Number of Workouts' },
          ]}
          {...form.getInputProps('type')}
        />

        <Select
          label="Time Period"
          description="How often do you want to reset this goal?"
          data={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'yearly', label: 'Yearly' },
          ]}
          {...form.getInputProps('period')}
        />

        <NumberInput
          label="Target Value"
          description={form.values.type === 'meters' ? 'Target distance in meters' : 'Target number of workouts'}
          min={1}
          {...form.getInputProps('targetValue')}
        />

        <DateInput
          label="Start Date"
          description="When do you want to start tracking this goal?"
          valueFormat="YYYY-MM-DD"
          {...form.getInputProps('startDate')}
        />

        <Button type="submit">
          {editingGoalId ? 'Update Goal' : 'Create Goal'}
        </Button>
      </Stack>
    </form>
  );
} 