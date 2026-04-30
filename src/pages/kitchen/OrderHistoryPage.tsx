import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Collapse,
  Group,
  Loader,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconBrandTelegram,
  IconChevronDown,
  IconChevronUp,
  IconExternalLink,
  IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useOrderHistory } from "../../service/orderHistory";
import { usePartners } from "../../service/partners";
import { useAuthStore } from "../../store/auth";
import type { KitchenOrder, KitchenOrderItem } from "../../types/kitchen";

function formatMoney(value?: number) {
  return new Intl.NumberFormat("ru-RU").format(value ?? 0);
}

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderStatus(order: KitchenOrder) {
  return order.status || "unknown";
}

function getPaymentStatus(order: KitchenOrder) {
  return order.payment_status || "unknown";
}

function getOrderItems(order: KitchenOrder) {
  return Array.isArray(order.items) ? order.items : [];
}

function getItemName(item: KitchenOrderItem) {
  return item.product?.name_uz || item.product?.name_ru || "";
}

function getPartnerName(order: KitchenOrder) {
  return order.partner?.name_uz || order.partner?.name_ru || "";
}

function getPartnerAddress(order: KitchenOrder) {
  return order.partner?.address_description || "";
}

function getTranslatedOrderStatus(t: (key: string) => string, status: string) {
  switch (status.toLowerCase()) {
    case "new":
      return t("kitchenPage.statusNew");
    case "closed":
      return t("kitchenPage.statusClosed");
    case "cancelled":
      return t("kitchenPage.statusCancelled");
    default:
      return status;
  }
}

function getTranslatedPaymentStatus(
  t: (key: string) => string,
  status: string,
) {
  switch (status.toLowerCase()) {
    case "paid":
      return t("kitchenPage.paymentPaid");
    case "unpaid":
      return t("kitchenPage.paymentUnpaid");
    default:
      return status;
  }
}

function getTranslatedPaymentType(
  t: (key: string) => string,
  paymentType?: string,
) {
  switch ((paymentType || "").toLowerCase()) {
    case "cash":
      return t("kitchenPage.paymentCash");
    case "click":
      return t("kitchenPage.paymentClick");
    case "payme":
      return t("kitchenPage.paymentPayme");
    default:
      return paymentType || "";
  }
}

function OrderHistoryCard({ order }: { order: KitchenOrder }) {
  const { t } = useTranslation();
  const items = getOrderItems(order);
  const orderStatus = getOrderStatus(order);
  const paymentStatus = getPaymentStatus(order);
  const partnerName = getPartnerName(order);
  const partnerAddress = getPartnerAddress(order);
  const isClosed = orderStatus.toLowerCase() === "closed";
  const telegramScreenshotLink = order.tg_payment_screenshot_link?.trim() || "";
  const hasTelegramScreenshotLink = Boolean(telegramScreenshotLink);

  return (
    <Card withBorder radius="lg" p="md" style={{ borderWidth: 2 }}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              {formatDate(order.created_at)}
            </Text>
          </div>
          <Badge color="dark" variant="light" size="lg">
            {formatMoney(order.total_amount)} so'm
          </Badge>
        </Group>

        <div
          style={{
            padding: "12px",
            borderRadius: "12px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <Group justify="space-between" mb="sm">
            <Text fw={600} size="sm">
              {t("kitchenPage.itemsLabel")}
            </Text>
            <Text size="sm" c="dimmed">
              {items.length}
            </Text>
          </Group>
          <Stack gap="xs">
            {items.map((item, index) => (
              <Group
                key={item.id || `${order.id || "order"}-${index}`}
                justify="space-between"
                align="center"
                gap="sm"
              >
                <Text size="sm" style={{ flex: 1 }} lineClamp={2}>
                  {getItemName(item) || t("kitchenPage.unknownProduct")}
                </Text>
                <Text size="sm" fw={600} c="dimmed">
                  x {item.quantity ?? 0}
                </Text>
              </Group>
            ))}
          </Stack>
        </div>

        <Stack gap="xs">
          {partnerName ? (
            <div>
              <Text size="xs" fw={600} c="dimmed">
                {t("kitchenPage.partnerLabel")}
              </Text>
              <Text size="sm">{partnerName}</Text>
            </div>
          ) : null}

          {partnerAddress ? (
            <div>
              <Text size="xs" fw={600} c="dimmed">
                {t("kitchenPage.addressLabel")}
              </Text>
              <Text size="sm">{partnerAddress}</Text>
            </div>
          ) : null}

          <Group gap="xs" wrap="wrap">
            <Badge variant="light" color={isClosed ? "green" : "blue"}>
              {getTranslatedOrderStatus(t, orderStatus)}
            </Badge>
            <Badge variant="light" color="gray">
              {getTranslatedPaymentStatus(t, paymentStatus)}
            </Badge>
            {order.payment_type ? (
              <Badge variant="light" color="orange">
                {getTranslatedPaymentType(t, order.payment_type)}
              </Badge>
            ) : null}
          </Group>

          {order.phone_number ? (
            <div>
              <Text size="xs" fw={600} c="dimmed">
                {t("kitchenPage.phoneLabel")}
              </Text>
              <Text size="sm">{order.phone_number}</Text>
            </div>
          ) : null}

          {order.delivery_address ? (
            <div>
              <Text size="xs" fw={600} c="dimmed">
                {t("kitchenPage.addressLabel")}
              </Text>
              <Text size="sm">{order.delivery_address}</Text>
            </div>
          ) : null}

          {order.comment ? (
            <div>
              <Text size="xs" fw={600} c="dimmed">
                {t("kitchenPage.commentLabel")}
              </Text>
              <Text size="sm">{order.comment}</Text>
            </div>
          ) : null}
        </Stack>
        <Button
          mt="auto"
          radius="md"
          variant="light"
          color="cyan"
          component={hasTelegramScreenshotLink ? "a" : "button"}
          href={hasTelegramScreenshotLink ? telegramScreenshotLink : undefined}
          target={hasTelegramScreenshotLink ? "_blank" : undefined}
          rel={hasTelegramScreenshotLink ? "noreferrer" : undefined}
          leftSection={<IconBrandTelegram size={16} />}
          rightSection={
            hasTelegramScreenshotLink ? <IconExternalLink size={16} /> : null
          }
          disabled={!hasTelegramScreenshotLink}
        >
          {t("kitchenPage.telegramScreenshot")}
        </Button>
      </Stack>
    </Card>
  );
}

export default function OrderHistoryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyId = useAuthStore((state) => state.company?.id);
  const partnerId = searchParams.get("partner_id");
  const paymentType = searchParams.get("payment_type");
  const status = searchParams.get("status");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.max(Number(limit) || 12, 1);
  const { data: partnersData } = usePartners(companyId, 500, 1);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(
    partnerId,
  );
  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(
    paymentType,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | null>(status);
  const [selectedDateRange, setSelectedDateRange] = useState<
    [string | null, string | null]
  >([startDate, endDate]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { data, error, isLoading, isFetching } = useOrderHistory({
    partnerId,
    paymentType,
    status,
    startDate,
    endDate,
    page,
    limit: String(currentLimit),
  });

  useEffect(() => {
    if (data?.raw) {
      console.log("Order history response:", data.raw);
    }
  }, [data]);

  useEffect(() => {
    setSelectedPartnerId(partnerId);
    setSelectedPaymentType(paymentType);
    setSelectedStatus(status);
    setSelectedDateRange([startDate, endDate]);
  }, [partnerId, paymentType, status, startDate, endDate]);

  useEffect(() => {
    if (partnerId || paymentType || status || startDate || endDate) {
      setIsFiltersOpen(true);
    }
  }, [partnerId, paymentType, status, startDate, endDate]);

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / currentLimit), 1);
  const activeFiltersCount = [
    selectedPartnerId,
    selectedPaymentType,
    selectedStatus,
    selectedDateRange[0],
    selectedDateRange[1],
  ].filter(Boolean).length;
  const partnerOptions = (partnersData?.partners ?? []).map((partner) => ({
    value: partner.id,
    label:
      partner.name_uz || partner.name_ru || t("kitchenPage.unknownPartner"),
  }));
  const paymentTypeOptions = [
    { value: "cash", label: t("kitchenPage.paymentCash") },
    { value: "click", label: t("kitchenPage.paymentClick") },
    { value: "payme", label: t("kitchenPage.paymentPayme") },
  ];
  const statusOptions = [
    { value: "new", label: t("kitchenPage.statusNew") },
    { value: "closed", label: t("kitchenPage.statusClosed") },
    { value: "cancelled", label: t("kitchenPage.statusCancelled") },
  ];

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
  };

  const updateFilters = ({
    nextPartnerId = selectedPartnerId,
    nextPaymentType = selectedPaymentType,
    nextStatus = selectedStatus,
    nextDateRange = selectedDateRange,
  }: {
    nextPartnerId?: string | null;
    nextPaymentType?: string | null;
    nextStatus?: string | null;
    nextDateRange?: [string | null, string | null];
  }) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextPartnerId) {
      nextParams.set("partner_id", nextPartnerId);
    } else {
      nextParams.delete("partner_id");
    }

    if (nextPaymentType) {
      nextParams.set("payment_type", nextPaymentType);
    } else {
      nextParams.delete("payment_type");
    }

    if (nextStatus) {
      nextParams.set("status", nextStatus);
    } else {
      nextParams.delete("status");
    }

    if (nextDateRange[0]) {
      nextParams.set("start_date", nextDateRange[0]);
    } else {
      nextParams.delete("start_date");
    }

    if (nextDateRange[1]) {
      nextParams.set("end_date", nextDateRange[1]);
    } else {
      nextParams.delete("end_date");
    }

    nextParams.set("page", "1");
    setSearchParams(nextParams);
  };

  const handlePartnerChange = (value: string | null) => {
    setSelectedPartnerId(value);
    updateFilters({ nextPartnerId: value });
  };

  const handlePaymentTypeChange = (value: string | null) => {
    setSelectedPaymentType(value);
    updateFilters({ nextPaymentType: value });
  };

  const handleStatusChange = (value: string | null) => {
    setSelectedStatus(value);
    updateFilters({ nextStatus: value });
  };

  const handleDateRangeChange = (value: [string | null, string | null]) => {
    setSelectedDateRange(value);
    updateFilters({ nextDateRange: value });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>{t("kitchenPage.orderHistoryNav")}</Title>
          <Text c="dimmed">{t("kitchenPage.ordersSubtitle")}</Text>
        </div>
        <Group gap="sm">
          <Badge color="orange" variant="light">
            {t("kitchenPage.ordersCount", { count: total })}
          </Badge>
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            loading={isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: ["order-history"],
              });
            }}
          >
            {t("commonActions.refresh")}
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="xl" p="md">
        <Stack gap="md">
          <Group justify="space-between" align="center" wrap="wrap">
            <div>
              <Title order={5}>{t("kitchenPage.filtersTitle")}</Title>
              <Text size="sm" c="dimmed">
                {t("kitchenPage.filtersSubtitle")}
              </Text>
            </div>
            <Group gap="sm">
              <Badge
                variant="light"
                color={activeFiltersCount ? "orange" : "gray"}
              >
                {activeFiltersCount}
              </Badge>
              <Button
                variant={isFiltersOpen ? "filled" : "light"}
                onClick={() => setIsFiltersOpen((current) => !current)}
                rightSection={
                  isFiltersOpen ? (
                    <IconChevronUp size={16} />
                  ) : (
                    <IconChevronDown size={16} />
                  )
                }
              >
                {t("kitchenPage.filterLabel")}
              </Button>
            </Group>
          </Group>

          <Collapse expanded={isFiltersOpen}>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
              <Select
                clearable
                searchable
                label={t("kitchenPage.partnerFilterLabel")}
                placeholder={t("kitchenPage.allPartners")}
                data={partnerOptions}
                value={selectedPartnerId}
                onChange={handlePartnerChange}
              />
              <Select
                clearable
                label={t("kitchenPage.paymentTypeFilterLabel")}
                placeholder={t("kitchenPage.allPaymentTypes")}
                data={paymentTypeOptions}
                value={selectedPaymentType}
                onChange={handlePaymentTypeChange}
              />
              <Select
                clearable
                label={t("kitchenPage.statusFilterLabel")}
                placeholder={t("kitchenPage.allStatuses")}
                data={statusOptions}
                value={selectedStatus}
                onChange={handleStatusChange}
              />
              <DatePickerInput
                clearable
                type="range"
                allowSingleDateInRange
                value={selectedDateRange}
                onChange={handleDateRangeChange}
                label={t("kitchenPage.dateRangeFilterLabel")}
                placeholder={t("kitchenPage.dateRangePlaceholder")}
              />
            </SimpleGrid>
          </Collapse>
        </Stack>
      </Card>

      <Card withBorder radius="xl" p="md">
        {error ? (
          <Stack gap="md">
            <Alert color="red" variant="light">
              {error.message}
            </Alert>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["order-history"],
                  });
                }}
              >
                {t("commonActions.retry")}
              </Button>
            </Group>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">{t("kitchenPage.loading")}</Text>
            </Stack>
          </Center>
        ) : !orders.length ? (
          <Alert color="blue" variant="light">
            {t("kitchenPage.noOrders")}
          </Alert>
        ) : (
          <Stack gap="md">
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                {t("kitchenPage.ordersCount", { count: total })}
              </Text>
              {activeFiltersCount ? (
                <Badge color="orange" variant="light">
                  {t("kitchenPage.filtersTitle")}
                </Badge>
              ) : null}
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="sm">
              {orders.map((order, index) => (
                <OrderHistoryCard
                  key={order.id || `order-history-${index}`}
                  order={order}
                />
              ))}
            </SimpleGrid>

            <Group justify="center">
              <Pagination
                value={currentPage}
                onChange={updatePage}
                total={totalPages}
              />
            </Group>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
