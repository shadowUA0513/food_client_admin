import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Pagination,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useOrderHistory } from "../../service/orderHistory";
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
  return (
    item.product?.name_uz ||
    item.product?.name_ru ||
    item.product_id ||
    item.id
  );
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

function getTranslatedPaymentStatus(t: (key: string) => string, status: string) {
  switch (status.toLowerCase()) {
    case "paid":
      return t("kitchenPage.paymentPaid");
    case "unpaid":
      return t("kitchenPage.paymentUnpaid");
    default:
      return status;
  }
}

function getTranslatedPaymentType(t: (key: string) => string, paymentType?: string) {
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

  return (
    <Card withBorder radius="lg" p="md" style={{ borderWidth: 2 }}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="lg">
              #{String(order.id ?? "").slice(0, 8) || "N/A"}
            </Text>
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
                  {getItemName(item)}
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
      </Stack>
    </Card>
  );
}

export default function OrderHistoryPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const partnerId = searchParams.get("partner_id");
  const paymentType = searchParams.get("payment_type");
  const status = searchParams.get("status");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const page = searchParams.get("page");
  const limit = searchParams.get("limit");
  const currentPage = Math.max(Number(page) || 1, 1);
  const currentLimit = Math.max(Number(limit) || 12, 1);
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

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / currentLimit), 1);

  const updatePage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
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
              <Text c="dimmed">Loading order history...</Text>
            </Stack>
          </Center>
        ) : !orders.length ? (
          <Alert color="blue" variant="light">
            {t("kitchenPage.noOrders")}
          </Alert>
        ) : (
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="sm">
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
