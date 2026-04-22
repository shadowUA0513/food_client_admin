import {
  Alert,
  Badge,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
} from "@mantine/core";
import { useKitchenOrders } from "../../hooks/useKitchenOrders";

interface KitchenOrdersModalProps {
  opened: boolean;
  onClose: () => void;
  companyId?: string | null;
  partnerId?: string | null;
}

export function KitchenOrdersModal({
  opened,
  onClose,
  companyId,
  partnerId,
}: KitchenOrdersModalProps) {
  const {
    data,
    error,
    isLoading,
    isFetching,
  } = useKitchenOrders(companyId, partnerId, opened);

  const partners = data?.data ?? [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Kitchen orders"
      size="lg"
      centered
    >
      {error ? (
        <Alert color="red" variant="light">
          {error.message}
        </Alert>
      ) : isLoading || isFetching ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader />
            <Text c="dimmed">Loading kitchen orders...</Text>
          </Stack>
        </Center>
      ) : !partnerId ? (
        <Alert color="orange" variant="light">
          Select a partner to view kitchen orders.
        </Alert>
      ) : !partners.length ? (
        <Alert color="blue" variant="light">
          No kitchen orders found.
        </Alert>
      ) : (
        <Stack gap="md">
          {partners.map((partner) => (
            <Card key={partner.partner_id} withBorder radius="lg" p="md">
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Text fw={700}>{partner.partner_name}</Text>
                  <Badge variant="light" color="orange">
                    {partner.products.length} products
                  </Badge>
                </Group>

                {!partner.products.length ? (
                  <Text size="sm" c="dimmed">
                    No products to prepare.
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {partner.products.map((product) => (
                      <Group
                        key={product.product_id}
                        justify="space-between"
                        align="flex-start"
                        gap="sm"
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500}>
                            {product.product_name}
                          </Text>
                          <Text size="xs" c="dimmed">
                            ID: {product.product_id}
                          </Text>
                        </div>
                        <Badge variant="light" color="green">
                          x {product.count_to_prepare}
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Modal>
  );
}
