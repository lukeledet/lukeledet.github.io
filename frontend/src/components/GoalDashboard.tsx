import { useEffect, useState } from 'react';
import { SimpleGrid, Button, Group, Title, Stack, Modal, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconRefresh } from '@tabler/icons-react';
import { GoalCard } from './GoalCard';
import { GoalForm } from './GoalForm';
import { useSupabase } from '../hooks/useSupabase';

interface Goal {
  id: string;
  type: 'meters' | 'workouts';
  period: 'yearly' | 'monthly' | 'weekly';
  target_value: number;
  start_date: string;
  current_value?: number;
  previous_value?: number;
}

export function GoalDashboard() {
  const { supabase } = useSupabase();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .order('period');

      if (error) throw error;

      // For each goal, calculate the current and previous progress
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          let current_value = 0;
          let previous_value = 0;

          // Get the start date for the current period
          const now = new Date();
          let currentPeriodStart = new Date(goal.start_date);
          let previousPeriodStart = new Date(goal.start_date);
          let previousPeriodEnd;
          
          switch (goal.period) {
            case 'yearly':
              currentPeriodStart = new Date(now.getFullYear(), 0, 1);
              previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
              previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
              break;
            case 'monthly':
              currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
              previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
              previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
              break;
            case 'weekly':
              // Get the start of the current week (Sunday)
              const day = now.getDay();
              currentPeriodStart = new Date(now);
              currentPeriodStart.setDate(now.getDate() - day);
              currentPeriodStart.setHours(0, 0, 0, 0);
              
              // Get the previous week
              previousPeriodStart = new Date(currentPeriodStart);
              previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
              previousPeriodEnd = new Date(currentPeriodStart);
              previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
              break;
          }

          // Query workouts for the current period
          const { data: currentWorkouts, error: currentWorkoutsError } = await supabase
            .from('workouts')
            .select('meters')
            .gte('workout_date', currentPeriodStart.toISOString().split('T')[0]);

          if (currentWorkoutsError) {
            console.error('Error fetching current workouts:', currentWorkoutsError);
            return { ...goal, current_value: 0, previous_value: 0 };
          }

          // Query workouts for the previous period
          const { data: previousWorkouts, error: previousWorkoutsError } = await supabase
            .from('workouts')
            .select('meters')
            .gte('workout_date', previousPeriodStart.toISOString().split('T')[0])
            .lte('workout_date', previousPeriodEnd.toISOString().split('T')[0]);

          if (previousWorkoutsError) {
            console.error('Error fetching previous workouts:', previousWorkoutsError);
            return { ...goal, current_value: 0, previous_value: 0 };
          }

          if (goal.type === 'meters') {
            // Sum up all meters
            current_value = currentWorkouts?.reduce((sum, workout) => sum + (workout.meters || 0), 0) || 0;
            previous_value = previousWorkouts?.reduce((sum, workout) => sum + (workout.meters || 0), 0) || 0;
          } else if (goal.type === 'workouts') {
            // Count number of workouts
            current_value = currentWorkouts?.length || 0;
            previous_value = previousWorkouts?.length || 0;
          }

          return {
            ...goal,
            current_value,
            previous_value,
          };
        })
      );

      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setSyncError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Calculate start date (beginning of current year)
      const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('sync-workouts', {
        body: {
          user_id: user.id,
          start_date: startDate
        }
      });

      if (error) throw error;

      console.log('Sync successful:', data);
      await fetchGoals(); // Refresh goals to show updated progress
    } catch (error) {
      console.error('Error syncing workouts:', error);
      setSyncError('Failed to sync workouts. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleEdit = (id: string) => {
    setEditingGoal(id);
    open();
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleFormClose = () => {
    setEditingGoal(null);
    close();
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return <div>Loading goals...</div>;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={2}>Your Goals</Title>
        <Group>
          <Button 
            onClick={handleSync} 
            loading={syncing}
            leftSection={<IconRefresh size={20} />}
            variant="light"
          >
            Sync Workouts
          </Button>
          <Button onClick={open}>Add New Goal</Button>
          <Button variant="light" color="red" onClick={handleLogout}>
            Logout
          </Button>
        </Group>
      </Group>

      {syncError && (
        <Alert color="red" title="Sync Error" onClose={() => setSyncError(null)} withCloseButton>
          {syncError}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </SimpleGrid>

      <Modal 
        opened={opened} 
        onClose={handleFormClose}
        title={editingGoal ? "Edit Goal" : "Create New Goal"}
        size="lg"
      >
        <GoalForm onSuccess={handleFormClose} editingGoalId={editingGoal} />
      </Modal>
    </Stack>
  );
} 