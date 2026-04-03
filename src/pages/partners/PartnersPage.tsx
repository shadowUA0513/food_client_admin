import { Badge, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

const partners = [
  { name: "Bellissimo Pizza", status: "active", branches: 12 },
  { name: "Oqtepa Lavash", status: "active", branches: 9 },
  { name: "Test Partner", status: "pending", branches: 3 },
];

export default function PartnersPage() {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>{t("partnersPage.title")}</Title>
        <Text c="dimmed">{t("partnersPage.subtitle")}</Text>
      </div>

      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            {t("partnersPage.totalPartners")}
          </Text>
          <Title order={3} mt={8}>
            24
          </Title>
        </Card>

        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            {t("partnersPage.activePartners")}
          </Text>
          <Title order={3} mt={8}>
            18
          </Title>
        </Card>

        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            {t("partnersPage.pendingPartners")}
          </Text>
          <Title order={3} mt={8}>
            6
          </Title>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="xl" p="lg">
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Title order={4}>{t("partnersPage.listTitle")}</Title>
              <Text c="dimmed" size="sm">
                {t("partnersPage.listSubtitle")}
              </Text>
            </div>
            <Badge color="orange" variant="light">
              {t("partnersPage.updatedToday")}
            </Badge>
          </Group>

          <Stack gap="sm">
            {partners.map((partner) => {
              const isActive = partner.status === "active";

              return (
                <Group
                  key={partner.name}
                  justify="space-between"
                  p="md"
                  style={{
                    border: "1px solid var(--mantine-color-gray-3)",
                    borderRadius: "var(--mantine-radius-lg)",
                  }}
                >
                  <div>
                    <Text fw={600}>{partner.name}</Text>
                    <Text size="sm" c="dimmed">
                      {t("partnersPage.branches", { count: partner.branches })}
                    </Text>
                  </div>
                  <Badge color={isActive ? "green" : "yellow"} variant="light">
                    {t(
                      isActive
                        ? "partnersPage.statusActive"
                        : "partnersPage.statusPending"
                    )}
                  </Badge>
                </Group>
              );
            })}
          </Stack>
        </Stack>
      </Card>
    </Stack>
  );
}
