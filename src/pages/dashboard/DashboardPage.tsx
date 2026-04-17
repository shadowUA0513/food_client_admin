import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  RingProgress,
  ScrollArea,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useFinancialStats,
  type FinancialPartnerStat,
} from "../../service/dashboard";
import { useAuthStore } from "../../store/auth";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function getPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card withBorder radius="xl" p="lg">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Title order={3} mt={8}>
        {value}
      </Title>
    </Card>
  );
}

function MetricBar({
  label,
  value,
  percent,
  color,
}: {
  label: string;
  value: string;
  percent: number;
  color: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div>
      <Group justify="space-between" mb={8} wrap="nowrap">
        <Text fw={600} lineClamp={1}>
          {label}
        </Text>
        <Text size="sm" c="dimmed">
          {value}
        </Text>
      </Group>
      <div
        style={{
          position: "relative",
          height: 12,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
        title={`${percent}%`}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            borderRadius: 999,
            background: color,
          }}
        />
        <Text
          size="xs"
          fw={700}
          style={{
            position: "absolute",
            top: -24,
            right: 0,
            opacity: isHovered ? 1 : 0,
            pointerEvents: "none",
            transition: "opacity 150ms ease",
            color: "var(--mantine-color-white)",
          }}
        >
          {percent}%
        </Text>
      </div>
    </div>
  );
}

function getMaxRevenue(partners: FinancialPartnerStat[]) {
  return Math.max(...partners.map((partner) => partner.total_amount), 0);
}

function getMaxOrders(partners: FinancialPartnerStat[]) {
  return Math.max(...partners.map((partner) => partner.order_count), 0);
}

function formatDateParam(value: string | null) {
  if (!value) {
    return undefined;
  }

  return value;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const company = useAuthStore((state) => state.company);
  const [selectedDateRange, setSelectedDateRange] = useState<
    [string | null, string | null]
  >([null, null]);
  const startDateParam = formatDateParam(selectedDateRange[0]);
  const endDateParam = formatDateParam(selectedDateRange[1]);
  const {
    data: financialStats,
    error: financialStatsError,
    isLoading: isFinancialStatsLoading,
    isFetching: isFinancialStatsFetching,
  } = useFinancialStats({
    companyId: company?.id,
    startDate: startDateParam,
    endDate: endDateParam,
  });
  const partners = financialStats?.data.partners ?? [];
  const totals = financialStats?.data.grand_total;
  const maxRevenue = getMaxRevenue(partners);
  const maxOrders = getMaxOrders(partners);
  const paymentSections = totals
    ? [
        {
          label: t("dashboard.cash"),
          value: totals.total_cash,
          color: "#f08c00",
        },
        {
          label: t("dashboard.click"),
          value: totals.total_click,
          color: "#15aabf",
        },
        {
          label: t("dashboard.payme"),
          value: totals.total_payme,
          color: "#7c3aed",
        },
      ]
    : [];

  return (
    <Stack gap="lg">
      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div>
            <Title order={2}>{t("common.dashboard")}</Title>
            <Text c="dimmed" mt={6}>
              {t("dashboard.subtitle")}
            </Text>
          </div>
          <Group gap="sm">
            <DatePickerInput
              type="range"
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              leftSection={<IconCalendar size={16} />}
              placeholder={t("dashboard.pickDatesRange")}
              clearable
              valueFormat="DD.MM.YYYY"
              maxDate={new Date()}
            />
            <Badge variant="light" color="gray" size="lg">
              {company?.name ?? t("dashboard.noCompany")}
            </Badge>
            <Button
              variant="light"
              loading={isFinancialStatsFetching}
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: [
                    "financial-stats",
                    company?.id,
                    startDateParam ?? null,
                    endDateParam ?? null,
                  ],
                });
              }}
            >
              {t("dashboard.refreshStats")}
            </Button>
          </Group>
        </Group>
      </Card>

      {financialStatsError ? (
        <Alert color="red" variant="light">
          {financialStatsError.message || t("dashboard.loadError")}
        </Alert>
      ) : isFinancialStatsLoading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader />
            <Text c="dimmed">{t("dashboard.loading")}</Text>
          </Stack>
        </Center>
      ) : totals ? (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, xl: 5 }}>
            <StatCard
              label={t("dashboard.totalRevenue")}
              value={`${formatMoney(totals.total_revenue)} UZS`}
            />
            <StatCard label={t("dashboard.totalOrders")} value={totals.total_orders} />
            <StatCard
              label={t("dashboard.cash")}
              value={`${formatMoney(totals.total_cash)} UZS`}
            />
            <StatCard
              label={t("dashboard.click")}
              value={`${formatMoney(totals.total_click)} UZS`}
            />
            <StatCard
              label={t("dashboard.payme")}
              value={`${formatMoney(totals.total_payme)} UZS`}
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, xl: 2 }}>
            <Card withBorder radius="xl" p="lg">
              <Text fw={700}>{t("dashboard.paymentDistribution")}</Text>
              <Text c="dimmed" size="sm" mt={4}>
                {t("dashboard.paymentDistributionHint")}
              </Text>

              <Group mt="xl" align="center" wrap="nowrap">
                <RingProgress
                  size={220}
                  thickness={28}
                  roundCaps
                  sections={
                    paymentSections.some((section) => section.value > 0)
                      ? paymentSections
                          .filter((section) => section.value > 0)
                          .map((section) => ({
                            value: getPercent(
                              section.value,
                              totals.total_revenue,
                            ),
                            color: section.color,
                          }))
                      : [{ value: 100, color: "gray" }]
                  }
                  label={
                    <Stack gap={0} align="center">
                      <Text fw={700} size="xl">
                        {formatMoney(totals.total_revenue)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {t("dashboard.uzsTotal")}
                      </Text>
                    </Stack>
                  }
                />

                <Stack gap="md" style={{ flex: 1 }}>
                  {paymentSections.map((section) => (
                    <Group
                      key={section.label}
                      justify="space-between"
                      wrap="nowrap"
                    >
                      <Group gap="sm" wrap="nowrap">
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 999,
                            backgroundColor: section.color,
                            flexShrink: 0,
                          }}
                        />
                        <Text>{section.label}</Text>
                      </Group>
                      <Stack gap={0} align="flex-end">
                        <Text fw={600}>{formatMoney(section.value)} UZS</Text>
                        <Text size="xs" c="dimmed">
                          {getPercent(section.value, totals.total_revenue)}%
                        </Text>
                      </Stack>
                    </Group>
                  ))}
                </Stack>
              </Group>
            </Card>

            <Card withBorder radius="xl" p="lg">
              <Text fw={700}>{t("dashboard.partnerRevenue")}</Text>
              <Text c="dimmed" size="sm" mt={4}>
                {t("dashboard.partnerRevenueHint")}
              </Text>

              <Stack gap="lg" mt="xl">
                {partners.map((partner) => (
                  <MetricBar
                    key={partner.partner_name}
                    label={partner.partner_name}
                    value={`${formatMoney(partner.total_amount)} UZS`}
                    percent={getPercent(partner.total_amount, maxRevenue)}
                    color="linear-gradient(90deg, #f08c00 0%, #ffd43b 100%)"
                  />
                ))}
              </Stack>
            </Card>
          </SimpleGrid>

          <Card withBorder radius="xl" p="lg">
            <Text fw={700}>{t("dashboard.partnerOrders")}</Text>
            <Text c="dimmed" size="sm" mt={4}>
              {t("dashboard.partnerOrdersHint")}
            </Text>

            <Stack gap="lg" mt="xl">
              {partners.map((partner) => (
                <MetricBar
                  key={`${partner.partner_name}-orders`}
                  label={partner.partner_name}
                  value={t("dashboard.ordersCount", { count: partner.order_count })}
                  percent={getPercent(partner.order_count, maxOrders)}
                  color="linear-gradient(90deg, #228be6 0%, #74c0fc 100%)"
                />
              ))}
            </Stack>
          </Card>

          <Card withBorder radius="xl" p="lg">
            <Group justify="space-between" align="center" mb="md">
              <div>
                <Text fw={700}>{t("dashboard.partnerPerformanceTable")}</Text>
                <Text c="dimmed" size="sm" mt={4}>
                  {t("dashboard.partnerPerformanceTableHint")}
                </Text>
              </div>
              <Badge variant="light" color="orange" size="lg">
                {t("dashboard.partnersCount", { count: partners.length })}
              </Badge>
            </Group>

            <ScrollArea>
              <Table
                highlightOnHover
                verticalSpacing="lg"
                horizontalSpacing="xl"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("dashboard.partnerOffice")}</Table.Th>
                    <Table.Th>{t("dashboard.totalOrders")}</Table.Th>
                    <Table.Th>{t("dashboard.cashWithCurrency")}</Table.Th>
                    <Table.Th>{t("dashboard.clickWithCurrency")}</Table.Th>
                    <Table.Th>{t("dashboard.paymeWithCurrency")}</Table.Th>
                    <Table.Th>{t("dashboard.totalWithCurrency")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {partners.map((partner) => (
                    <Table.Tr key={`table-${partner.partner_name}`}>
                      <Table.Td>
                        <Text fw={700}>{partner.partner_name}</Text>
                      </Table.Td>
                      <Table.Td>{partner.order_count}</Table.Td>
                      <Table.Td>{formatMoney(partner.cash_amount)}</Table.Td>
                      <Table.Td>{formatMoney(partner.click_amount)}</Table.Td>
                      <Table.Td>{formatMoney(partner.payme_amount)}</Table.Td>
                      <Table.Td>
                        <Text fw={700}>
                          {formatMoney(partner.total_amount)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  <Table.Tr>
                    <Table.Td>
                      <Text fw={800}>{t("dashboard.total")}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={800}>{totals.total_orders}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={800}>{formatMoney(totals.total_cash)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={800}>{formatMoney(totals.total_click)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={800}>{formatMoney(totals.total_payme)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={800}>{formatMoney(totals.total_revenue)}</Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Card>
        </>
      ) : (
        <Alert color="blue" variant="light">
          {t("dashboard.noFinancialStatistics")}
        </Alert>
      )}
    </Stack>
  );
}
