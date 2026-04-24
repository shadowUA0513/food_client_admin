import {
  Alert,
  Badge,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconBuildingStore } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { data, error, isLoading, isFetching } = useKitchenOrders(
    companyId,
    partnerId,
    opened,
  );

  const partners = data?.data ?? [];
  // const totalProductsToPrepare = partners.reduce(
  //   (sum, partner) =>
  //     sum +
  //     partner.products.reduce(
  //       (partnerSum, product) => partnerSum + product.count_to_prepare,
  //       0,
  //     ),
  //   0,
  // );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Stack gap={2}>
          <Text fw={800}>{t("kitchenPage.ordersTitle")}</Text>
          <Text size="sm" c="dimmed">
            {t("kitchenPage.ordersSubtitle")}
          </Text>
        </Stack>
      }
      size="lg"
      centered
      radius="xl"
    >
      <ScrollArea.Autosize mah="70vh" offsetScrollbars>
        {error ? (
          <Alert color="red" variant="light">
            {error.message}
          </Alert>
        ) : isLoading || isFetching ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">{t("kitchenPage.loading")}</Text>
            </Stack>
          </Center>
        ) : !partnerId ? (
          <Alert color="orange" variant="light">
            {t("kitchenPage.selectPartnerPrompt")}
          </Alert>
        ) : !partners.length ? (
          <Alert color="blue" variant="light">
            {t("kitchenPage.noOrders")}
          </Alert>
        ) : (
          <Stack gap="md">
            {partners.map((partner) => (
              <Card
                key={partner.partner_id}
                withBorder
                radius="xl"
                p="lg"
                style={{
                  borderWidth: 1,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
                }}
              >
                <Stack gap="md">
                  <Group
                    justify="space-between"
                    align="flex-start"
                    wrap="nowrap"
                  >
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      <ThemeIcon
                        variant="light"
                        color="orange"
                        radius="md"
                        size={38}
                      >
                        <IconBuildingStore size={18} />
                      </ThemeIcon>
                      <div style={{ minWidth: 0 }}>
                        <Text fw={700} lineClamp={2}>
                          {partner.partner_name ||
                            t("kitchenPage.unknownPartner")}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {t("kitchenPage.productsCount", {
                            count: partner.products.length,
                          })}
                        </Text>
                      </div>
                    </Group>
                    <Badge variant="light" color="orange" radius="xl">
                      {t("kitchenPage.productsCount", {
                        count: partner.products.reduce(
                          (sum, product) => sum + product.count_to_prepare,
                          0,
                        ),
                      })}
                    </Badge>
                  </Group>

                  <Divider />

                  {!partner.products.length ? (
                    <Text size="sm" c="dimmed">
                      {t("kitchenPage.noProductsToPrepare")}
                    </Text>
                  ) : (
                    <Stack gap="xs">
                      {partner.products.map((product, index) => (
                        <Group
                          key={product.product_id}
                          justify="space-between"
                          align="center"
                          gap="sm"
                          style={{
                            padding: "12px 14px",
                            borderRadius: "14px",
                            backgroundColor: "rgba(255, 255, 255, 0.035)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          <Group
                            gap="sm"
                            wrap="nowrap"
                            style={{ flex: 1, minWidth: 0 }}
                          >
                            <ThemeIcon
                              variant="light"
                              color="gray"
                              radius="xl"
                              size={30}
                            >
                              <Text size="xs" fw={700}>
                                {index + 1}
                              </Text>
                            </ThemeIcon>
                            <div style={{ minWidth: 0 }}>
                              <Text size="sm" fw={600} lineClamp={2}>
                                {product.product_name ||
                                  t("kitchenPage.unknownProduct")}
                              </Text>
                            </div>
                          </Group>
                          <Badge
                            variant="light"
                            color="green"
                            radius="xl"
                            size="lg"
                          >
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
      </ScrollArea.Autosize>
    </Modal>
  );
}
