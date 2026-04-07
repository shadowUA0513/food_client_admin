import {
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { IconRefresh } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useKitchenOrders } from "../../service/kitchen";
import { useAuthStore } from "../../store/auth";

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const company = useAuthStore((state) => state.company);
  const { data, error, isLoading, isFetching } = useKitchenOrders(company?.id);

  const partners = data?.partners ?? [];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>Kitchen</Title>
          <Text c="dimmed">
            Open a partner and see its orders in a simple list.
          </Text>
        </div>
        <Group gap="sm">
          <Badge color="orange" variant="light">
            {partners.length} partners
          </Badge>
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
            Refresh
          </Button>
        </Group>
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
                Retry
              </Button>
            </Group>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">Loading kitchen orders...</Text>
            </Stack>
          </Center>
        ) : !partners.length ? (
          <Alert color="blue" variant="light">
            No kitchen partners or orders found.
          </Alert>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="sm">
            {partners.map((partner) => (
              <Card
                key={partner.partner_id}
                withBorder
                radius="md"
                p="sm"
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  borderWidth: 2,
                }}
                component="button"
                onClick={() => {
                  navigate(`/kitchen/${partner.partner_id}`);
                }}
              >
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={700}>{partner.partner_name}</Text>
                      <Text size="sm" c="dimmed">
                        Partner
                      </Text>
                    </div>
                    <Badge
                      color="orange"
                      variant="light"
                      size="lg"
                      styles={{ root: { whiteSpace: "nowrap", flexShrink: 0, maxWidth: "100%" } }}
                    >
                      {partner.order_count} orders
                    </Badge>
                  </Group>

                  <div>
                    <Text size="sm" c="dimmed">
                      Open this partner to see items and totals.
                    </Text>
                  </div>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Card>
    </Stack>
  );
}
