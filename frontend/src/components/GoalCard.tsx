import { Card, Text, Progress, Group, Stack, ActionIcon, Grid } from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';

interface GoalCardProps {
  goal: {
    id: string;
    type: 'meters' | 'workouts';
    period: 'yearly' | 'monthly' | 'weekly';
    target_value: number;
    start_date: string;
    current_value?: number;
    previous_value?: number;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const currentProgress = goal.current_value ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
  const previousProgress = goal.previous_value ? Math.min(100, (goal.previous_value / goal.target_value) * 100) : 0;
  
  const formatValue = (value: number) => {
    if (goal.type === 'meters') {
      return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
    }
    return value.toString();
  };

  const getPeriodLabel = (period: string, isPrevious = false) => {
    const prefix = isPrevious ? 'Last ' : 'This ';
    switch (period) {
      case 'yearly':
        return prefix + 'Year';
      case 'monthly':
        return prefix + 'Month';
      case 'weekly':
        return prefix + 'Week';
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
            Target: {formatValue(goal.target_value)}
          </Text>
        </Group>
      </Card.Section>

      <Stack gap="md" mt="md">
        {/* Current Period */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>{getPeriodLabel(goal.period)}</Text>
          <Group justify="space-between">
            <Text size="sm">Progress</Text>
            <Text size="sm" fw={500}>
              {formatValue(goal.current_value || 0)}
            </Text>
          </Group>
          <Progress value={currentProgress} size="md" radius="xl" />
        </Stack>

        {/* Previous Period */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>{getPeriodLabel(goal.period, true)}</Text>
          <Group justify="space-between">
            <Text size="sm">Progress</Text>
            <Text size="sm" fw={500}>
              {formatValue(goal.previous_value || 0)}
            </Text>
          </Group>
          <Progress value={previousProgress} size="md" radius="xl" color="gray.5" />
        </Stack>
        
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