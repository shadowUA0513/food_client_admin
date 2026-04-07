import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKitchenOrders } from "../../service/kitchen";
import { useProducts } from "../../service/products";
import { useAuthStore } from "../../store/auth";
import type { KitchenOrder } from "../../types/kitchen";
import type { Product } from "../../types/products";

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProductMap(products: Product[]) {
  return new Map(
    products.map((product) => [
      product.id,
      product.name_uz || product.name_ru || product.id,
    ]),
  );
}

function OrderCard({
  order,
  productMap,
}: {
  order: KitchenOrder;
  productMap: Map<string, string>;
}) {
  return (
    <Card withBorder radius="md" p="sm" style={{ borderWidth: 2 }}>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700}>#{order.id.slice(0, 8)}</Text>
            <Text size="sm" c="dimmed">
              {formatDate(order.created_at)}
            </Text>
          </div>
          <Badge
            color="orange"
            variant="light"
            size="lg"
            styles={{ root: { whiteSpace: "nowrap", flexShrink: 0, maxWidth: "100%" } }}
          >
            {formatMoney(order.total_amount)} so'm
          </Badge>
        </Group>

        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={600}>Items</Text>
            <Badge variant="light">{order.items.length}</Badge>
          </Group>
          <Stack gap="xs">
            {order.items.map((item) => (
              <Group
                key={item.id}
                justify="space-between"
                align="flex-start"
                gap="sm"
              >
                <Text size="sm" style={{ flex: 1 }}>
                  {productMap.get(item.product_id) ?? item.product_id}
                </Text>
                <Text size="sm" c="dimmed">
                  x{item.quantity}
                </Text>
              </Group>
            ))}
          </Stack>
        </div>

        <Group gap="xs" wrap="wrap">
          <Badge
            variant="light"
            color="gray"
            styles={{ root: { whiteSpace: "nowrap" } }}
          >
            {order.status}
          </Badge>
          <Badge
            variant="light"
            color="gray"
            styles={{ root: { whiteSpace: "nowrap" } }}
          >
            {order.payment_status}
          </Badge>
        </Group>
      </Stack>
    </Card>
  );
}

export default function KitchenPartnerOrdersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { partnerId } = useParams();
  const company = useAuthStore((state) => state.company);
  const { data, error, isLoading, isFetching } = useKitchenOrders(company?.id);
  const { data: productsData } = useProducts(company?.id, 500, 1);

  const partners = data?.partners ?? [];
  const selectedPartner = partners.find(
    (partner) => partner.partner_id === partnerId,
  );
  const productMap = getProductMap(productsData?.products ?? []);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            px={0}
            onClick={() => {
              navigate("/kitchen");
            }}
          >
            {t("kitchenPage.backToPartners")}
          </Button>
          <Title order={3} mt="xs">
            {selectedPartner?.partner_name ?? t("kitchenPage.ordersTitle")}
          </Title>
          <Text c="dimmed">{t("kitchenPage.ordersSubtitle")}</Text>
        </div>
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          loading={isFetching}
          onClick={() => {
            void queryClient.invalidateQueries({
              queryKey: ["kitchen-orders", company?.id],
            });
          }}
        >
          {t("commonActions.refresh")}
        </Button>
      </Group>

      <Card withBorder radius="xl" p="md">
        {error ? (
          <Stack gap="md">
            <Alert color="red" variant="light">
              {error.message || "Failed to load kitchen orders."}
            </Alert>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["kitchen-orders", company?.id],
                  });
                }}
              >
                {t("commonActions.retry")}
              </Button>
            </Group>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Text c="dimmed">{t("kitchenPage.loading")}</Text>
          </Center>
        ) : !selectedPartner ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text c="dimmed">{t("kitchenPage.partnerNotFound")}</Text>
              <Button
                variant="light"
                onClick={() => {
                  navigate("/kitchen", { replace: true });
                }}
              >
                {t("kitchenPage.goToPartners")}
              </Button>
            </Stack>
          </Center>
        ) : !selectedPartner.orders.length ? (
          <Center py="xl">
            <Text c="dimmed">{t("kitchenPage.noOrders")}</Text>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="sm">
            {selectedPartner.orders.map((order) => (
              <OrderCard key={order.id} order={order} productMap={productMap} />
            ))}
          </SimpleGrid>
        )}
      </Card>
    </Stack>
  );
}



