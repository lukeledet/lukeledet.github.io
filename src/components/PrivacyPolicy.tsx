import { Title, Text, Stack, Container, List } from '@mantine/core';

export function PrivacyPolicy() {
  return (
    <Container size="md">
      <Stack gap="xl">
        <Title>Privacy Policy</Title>
        
        <Stack gap="md">
          <Text size="lg" fw={500}>Our Commitment to Your Privacy</Text>
          <Text>
            At Rowing Goals, we take your privacy seriously. This privacy policy outlines our 
            fundamental commitment: we will never distribute, sell, or give away your data to 
            any third parties under any circumstances.
          </Text>

          <Text size="lg" fw={500}>Data Collection and Usage</Text>
          <Text>
            We only collect the minimum amount of data necessary to provide you with our service:
          </Text>
          <List>
            <List.Item>Your Concept2 workout data, which we sync directly from your logbook</List.Item>
            <List.Item>Basic account information required for authentication</List.Item>
            <List.Item>Goals and preferences you set within the application</List.Item>
          </List>

          <Text size="lg" fw={500}>How We Use Your Data</Text>
          <Text>
            Your data is used exclusively for:
          </Text>
          <List>
            <List.Item>Displaying your workout information in your personal dashboard</List.Item>
            <List.Item>Tracking progress towards your goals</List.Item>
            <List.Item>Providing you with insights about your rowing activities</List.Item>
          </List>

          <Text size="lg" fw={500}>Data Protection</Text>
          <Text>
            We implement industry-standard security measures to protect your data. Your information 
            is stored securely and is only accessible to you through your authenticated account.
          </Text>

          <Text size="lg" fw={500}>Our Promise</Text>
          <Text>
            We will:
          </Text>
          <List>
            <List.Item>Never sell your personal data</List.Item>
            <List.Item>Never share your information with third parties</List.Item>
            <List.Item>Never use your data for marketing purposes</List.Item>
            <List.Item>Never distribute your workout information</List.Item>
          </List>

          <Text size="lg" fw={500}>Data Deletion</Text>
          <Text>
            You can request complete deletion of your account and associated data at any time by 
            contacting us. Upon deletion, all your personal information and workout data will be 
            permanently removed from our systems.
          </Text>

          <Text mt="xl" size="sm" c="dimmed">
            Last updated: {new Date().toLocaleDateString()}
          </Text>
        </Stack>
      </Stack>
    </Container>
  );
} 