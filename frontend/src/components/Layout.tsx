import { Container, Group, Text, Anchor, Box, Paper } from '@mantine/core';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Paper style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container size="xl" py="xl" style={{ flex: 1 }}>
        {children}
      </Container>

      <Box component="footer" style={{ borderTop: '1px solid var(--mantine-color-gray-3)', marginTop: 'auto' }}>
        <Container size="xl" py="md">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              © {currentYear} Rowing Goals. All rights reserved.
            </Text>
            <Group gap="lg" justify="flex-end">
              <Anchor component="a" href="/privacy" size="sm" c="dimmed">
                Privacy Policy
              </Anchor>
              <Anchor component="a" href="/contact" size="sm" c="dimmed">
                Contact Us
              </Anchor>
            </Group>
          </Group>
        </Container>
      </Box>
    </Paper>
  );
} 
