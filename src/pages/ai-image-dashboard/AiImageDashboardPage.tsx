import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconCurrencyDollar,
  IconPhoto,
  IconSearch,
} from "@tabler/icons-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/auth";
import {
  useImageGenerationUsage,
  useImageGenerations,
} from "../../service/images";

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <Card withBorder radius="xl" p="lg">
      <Group gap="xs" c={color}>
        {icon}
        <Text size="sm" fw={600} c={color}>
          {label}
        </Text>
      </Group>
      <Title order={2} mt="sm" c={color}>
        {value}
      </Title>
    </Card>
  );
}

export default function AiImageDashboardPage() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.company?.id);
  const [period, setPeriod] = useState("30");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const fromDate = new Date(today);

  if (period !== "custom") {
    fromDate.setDate(today.getDate() - (Number(period) - 1));
  }

  const {
    data: generations = [],
    isLoading,
    isFetching,
    error,
  } = useImageGenerations({
    companyId,
    query: search,
    status: statusFilter === "all" ? undefined : statusFilter,
    paid: false,
    from: period === "custom" ? undefined : formatDate(fromDate),
    to: period === "custom" ? undefined : formatDate(today),
    page: 1,
    limit: 20,
  });
  const {
    data: usage,
    isLoading: isUsageLoading,
    error: usageError,
  } = useImageGenerationUsage({
    companyId,
    from: period === "custom" ? undefined : formatDate(fromDate),
    to: period === "custom" ? undefined : formatDate(today),
  });
  const usageValue = (value: number) =>
    isUsageLoading ? "..." : String(value);

  return (
    <Stack gap="lg">
      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <div>
            <Title order={2}>
              {t("aiImageDashboard.title", {
                defaultValue: "Photo generation - statistics and logs",
              })}
            </Title>
            <Text c="dimmed" mt={6}>
              {t("aiImageDashboard.subtitle", {
                defaultValue:
                  "AI generator usage for company products and billing.",
              })}
            </Text>
          </div>
          <SegmentedControl
            value={period}
            onChange={setPeriod}
            disabled={isFetching}
            data={[
              { label: t("aiImageDashboard.today"), value: "1" },
              { label: t("aiImageDashboard.sevenDays"), value: "7" },
              { label: t("aiImageDashboard.thirtyDays"), value: "30" },
              { label: t("aiImageDashboard.custom"), value: "custom" },
            ]}
          />
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
        <StatCard
          label={t("aiImageDashboard.totalGenerations")}
          value={usageValue(usage?.total ?? 0)}
          color="var(--mantine-color-blue-6)"
          icon={<IconPhoto size={16} />}
        />
        <StatCard
          label={t("aiImageDashboard.successful")}
          value={usageValue(usage?.successful ?? 0)}
          color="var(--mantine-color-teal-6)"
          icon={<IconCheck size={16} />}
        />
        <StatCard
          label={t("aiImageDashboard.errors")}
          value={usageValue(usage?.errors ?? 0)}
          color="var(--mantine-color-red-6)"
          icon={<IconAlertCircle size={16} />}
        />
        <StatCard
          label={t("aiImageDashboard.estimatedCost")}
          value={
            isUsageLoading
              ? "..."
              : `$${(usage?.estimatedCost ?? 0).toFixed(2)}`
          }
          color="var(--mantine-color-violet-6)"
          icon={<IconCurrencyDollar size={16} />}
        />
      </SimpleGrid>

      {usageError ? (
        <Alert color="red" variant="light">
          {usageError.message}
        </Alert>
      ) : null}

      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="center" mb="md" wrap="wrap">
          <Text fw={700}>
            {t("aiImageDashboard.logTitle", { defaultValue: "Generation log" })}
          </Text>
          <Group gap="sm">
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder={t("aiImageDashboard.searchPlaceholder")}
              leftSection={<IconSearch size={16} />}
              aria-label={t("aiImageDashboard.searchPlaceholder")}
              rightSection={isFetching ? <Loader size={16} /> : undefined}
            />
            <SegmentedControl
              value={statusFilter}
              onChange={setStatusFilter}
              data={[
                { label: t("aiImageDashboard.all"), value: "all" },
                { label: t("aiImageDashboard.successful"), value: "success" },
                {
                  label: t("aiImageDashboard.failed", {
                    defaultValue: "Failed",
                  }),
                  value: "failed",
                },
              ]}
              size="sm"
            />
          </Group>
        </Group>

        {error ? (
          <Alert color="red" variant="light" mb="md">
            {error.message}
          </Alert>
        ) : null}

        <Table.ScrollContainer minWidth={520}>
          <Table highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("aiImageDashboard.time")}</Table.Th>
                <Table.Th>{t("aiImageDashboard.product")}</Table.Th>
                <Table.Th>{t("aiImageDashboard.status")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Center py="xl">
                      <Loader />
                    </Center>
                  </Table.Td>
                </Table.Tr>
              ) : generations.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={3}>
                    <Text ta="center" c="dimmed" py="xl">
                      {t("aiImageDashboard.noGenerations")}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                generations.map((log) => (
                  <Table.Tr key={`${log.time}-${log.product_name}`}>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {log.time}
                      </Text>
                    </Table.Td>
                    <Table.Td>{log.product_name}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={log.status === "success" ? "teal" : "red"}
                        variant="light"
                      >
                        {log.status === "success"
                          ? t("aiImageDashboard.successful")
                          : t("aiImageDashboard.failed", {
                              defaultValue: "Failed",
                            })}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </Stack>
  );
}
