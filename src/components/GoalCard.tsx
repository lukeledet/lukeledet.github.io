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

  const formatProgress = (value?: number) => {
    if (!value) return '0%';
    const percent = (value / goal.target_value) * 100;
    return `${percent.toFixed(1)}%`;
  };

  const getTimeProgress = () => {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (goal.period) {
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1); // January 1st
        periodEnd = new Date(now.getFullYear() + 1, 0, 1); // Next January 1st
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month
        break;
      case 'weekly':
        const day = now.getDay();
        periodStart = new Date(now); // Clone current date
        periodStart.setDate(now.getDate() - day); // Go back to Sunday
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 7); // Next Sunday
        break;
      default:
        return 0;
    }

    const totalTime = periodEnd.getTime() - periodStart.getTime();
    const elapsedTime = now.getTime() - periodStart.getTime();
    return (elapsedTime / totalTime) * 100;
  };

  const getProgressColor = (value?: number) => {
    if (!value) return 'gray.3'; // No progress
    const percent = (value / goal.target_value) * 100;
    
    if (percent >= 100) return 'green.7'; // Goal achieved
    if (percent >= 80) return 'blue.9';
    if (percent >= 60) return 'blue.7';
    if (percent >= 40) return 'blue.5';
    if (percent >= 20) return 'blue.3';
    return 'gray.5'; // Less than 20%
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

  const getGoalTypeLabel = () => {
    const periodLabel = goal.period.charAt(0).toUpperCase() + goal.period.slice(1);
    return `${periodLabel} ${goal.type === 'meters' ? 'Distance' : 'Workout'} Goal`;
  };

  const timeProgress = getTimeProgress();

  return (
    <Card withBorder padding="md" radius="md">
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Text fw={500} size="lg">
            {getGoalTypeLabel()}
          </Text>
          <Text size="sm" c="dimmed">
            Target: {formatValue(goal.target_value)}
          </Text>
        </Group>
      </Card.Section>

      <Stack gap="md" mt="md">
        {/* Current Period */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" fw={500}>{getPeriodLabel(goal.period)}</Text>
            <Text size="sm" c="dimmed">
              {timeProgress.toFixed(1)}% elapsed
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">Progress</Text>
            <Group gap="xs">
              <Text size="sm" fw={500} c={getProgressColor(goal.current_value)}>
                {formatValue(goal.current_value || 0)}
              </Text>
              <Text size="sm" c="dimmed">
                ({formatProgress(goal.current_value)})
              </Text>
            </Group>
          </Group>
          <Progress 
            value={currentProgress} 
            size="md" 
            radius="xl"
            color={getProgressColor(goal.current_value)}
          />
        </Stack>

        {/* Previous Period */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>{getPeriodLabel(goal.period, true)}</Text>
          <Group justify="space-between">
            <Text size="sm">Progress</Text>
            <Group gap="xs">
              <Text size="sm" fw={500} c={getProgressColor(goal.previous_value)}>
                {formatValue(goal.previous_value || 0)}
              </Text>
              <Text size="sm" c="dimmed">
                ({formatProgress(goal.previous_value)})
              </Text>
            </Group>
          </Group>
          <Progress 
            value={previousProgress} 
            size="md" 
            radius="xl" 
            color={getProgressColor(goal.previous_value)}
          />
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
