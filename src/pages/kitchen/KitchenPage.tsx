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
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useKitchenOrders } from "../../service/kitchen";
import { useAuthStore } from "../../store/auth";

export default function KitchenPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const company = useAuthStore((state) => state.company);
  const { data, error, isLoading, isFetching } = useKitchenOrders(company?.id);

  const partners = data?.partners ?? [];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>{t("kitchenPage.title")}</Title>
          <Text c="dimmed">
            {t("kitchenPage.subtitle")}
          </Text>
        </div>
        <Group gap="sm">
          <Badge color="orange" variant="light">
            {t("kitchenPage.partnersCount", { count: partners.length })}
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
            {t("commonActions.refresh")}
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="xl" p="md">
        {error ? (
          <Stack gap="md">
            <Alert color="red" variant="light">
              {error.message || t("kitchenPage.loadError")}
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
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">{t("kitchenPage.loading")}</Text>
            </Stack>
          </Center>
        ) : !partners.length ? (
          <Alert color="blue" variant="light">
            {t("kitchenPage.empty")}
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
                        {t("kitchenPage.partnerLabel")}
                      </Text>
                    </div>
                    <Badge
                      color="orange"
                      variant="light"
                      size="lg"
                      styles={{ root: { whiteSpace: "nowrap", flexShrink: 0, maxWidth: "100%" } }}
                    >
                      {t("kitchenPage.ordersCount", {
                        count: partner.order_count,
                      })}
                    </Badge>
                  </Group>

                  <div>
                    <Text size="sm" c="dimmed">
                      {t("kitchenPage.openPartnerHint")}
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




