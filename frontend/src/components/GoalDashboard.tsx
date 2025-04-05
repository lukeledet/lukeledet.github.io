import { useEffect, useState } from 'react';
import { SimpleGrid, Button, Group, Title, Stack, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
}

export function GoalDashboard() {
  const { supabase } = useSupabase();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      const { data: goalsData, error } = await supabase
        .from('goals')
        .select('*')
        .order('period');

      if (error) throw error;

      // For each goal, calculate the current progress
      const goalsWithProgress = await Promise.all(
        (goalsData || []).map(async (goal) => {
          let current_value = 0;

          // TODO: Replace with actual progress calculation based on workout data
          // This is where we'll integrate with the Concept2 API to get actual meters/workouts
          
          return {
            ...goal,
            current_value,
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
    fetchGoals();
  };

  if (loading) {
    return <div>Loading goals...</div>;
  }

  return (
    <Stack gap="xl">
      <Group justify="space-between">
        <Title order={2}>Your Goals</Title>
        <Button onClick={open}>Add New Goal</Button>
      </Group>

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