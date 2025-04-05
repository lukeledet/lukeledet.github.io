import { Card, Text, Progress, Group, Stack, ActionIcon } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';

interface GoalCardProps {
  goal: {
    id: string;
    type: 'meters' | 'workouts';
    period: 'yearly' | 'monthly' | 'weekly';
    target_value: number;
    start_date: string;
    current_value?: number;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = goal.current_value ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
  
  const formatValue = (value: number) => {
    if (goal.type === 'meters') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
    }
    return value.toString();
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'yearly':
        return 'Year';
      case 'monthly':
        return 'Month';
      case 'weekly':
        return 'Week';
      default:
        return period;
    }
  };

  return (
    <Card withBorder padding="md" radius="md">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            {goal.type === 'meters' ? 'Distance Goal' : 'Workout Goal'}
          </Text>
          <Text size="sm" c="dimmed">
            This {getPeriodLabel(goal.period)}
          </Text>
        </Group>
      </Card.Section>

      <Stack gap="sm" mt="md">
        <Group justify="space-between">
          <Text size="sm">Progress</Text>
          <Group gap="xs">
            <Text size="sm" fw={500}>
              {formatValue(goal.current_value || 0)}
            </Text>
            <Text size="sm" c="dimmed">
              / {formatValue(goal.target_value)}
            </Text>
          </Group>
        </Group>

        <Progress value={progress} size="lg" radius="xl" />
        
        <Group justify="flex-end" gap="xs">
          {onEdit && (
            <ActionIcon variant="subtle" onClick={() => onEdit(goal.id)}>
              <IconEdit size={16} />
            </ActionIcon>
          )}
          {onDelete && (
            <ActionIcon variant="subtle" color="red" onClick={() => onDelete(goal.id)}>
              <IconTrash size={16} />
            </ActionIcon>
          )}
        </Group>
      </Stack>
    </Card>
  );
} 