import { Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/auth";

export default function DashboardPage() {
  const { t } = useTranslation();
  const company = useAuthStore((state) => state.company);
  const user = useAuthStore((state) => state.user);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t("common.dashboard")}</Title>
        <Text c="dimmed">{t("dashboard.empty")}</Text>
      </div>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            Company
          </Text>
          <Title order={3} mt={8}>
            {company?.name ?? "-"}
          </Title>
        </Card>

        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            User
          </Text>
          <Title order={3} mt={8}>
            {user?.full_name ?? "-"}
          </Title>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Text c="dimmed" size="sm">
              Company ID
            </Text>
            <Text fw={600} mt={8}>
              {company?.id ?? "-"}
            </Text>
          </div>
          <div>
            <Text c="dimmed" size="sm">
              Role
            </Text>
            <Text fw={600} mt={8}>
              {user?.role ?? "-"}
            </Text>
          </div>
        </Group>
      </Card>
    </Stack>
  );
}
