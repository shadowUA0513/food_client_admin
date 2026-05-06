import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Divider,
  Group,
  Loader,
  Modal,
  Paper,
  Radio,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
  useComputedColorScheme,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBuildingStore,
  IconCheck,
  IconCreditCard,
  IconMinus,
  IconPhotoOff,
  IconPlus,
  IconReceipt2,
  IconShoppingCart,
  IconTruckDelivery,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MapAddressPicker } from "../../components/common/MapAddressPicker";
import { PhoneNumberInput } from "../../components/common/PhoneNumberInput";
import { PartnerMapPicker } from "../../components/common/PartnerMapPicker";
import { useCategories } from "../../service/categories";
import { useCreateCompanyOrder } from "../../service/orders";
import { usePartners } from "../../service/partners";
import { useProducts } from "../../service/products";
import { useCompanySettings } from "../../service/settings";
import { useAuthStore } from "../../store/auth";
import type { CreateCompanyOrderPayload } from "../../types/order";
import type { Partner } from "../../types/partners";
import type { Product } from "../../types/products";
import { hasCompleteUzbekistanPhone } from "../../utils/phone";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

type CheckoutType = "myself" | "partners";
type PaymentType = "cash" | "click" | "payme" | "card";

function formatPrice(value: number, language: string) {
  const locale = language === "uz" ? "uz-UZ" : "ru-RU";

  return `${new Intl.NumberFormat(locale).format(value)} UZS`;
}

function getProductName(product: Product, language: string) {
  return language === "uz" ? product.name_uz : product.name_ru;
}

function getDiscountPercent(price: number, discountedPrice: number) {
  if (price <= 0 || discountedPrice <= 0 || discountedPrice >= price) {
    return null;
  }

  return Math.round(((price - discountedPrice) / price) * 100);
}

function getEffectivePrice(product: Product) {
  return product.discounted_price > 0 &&
    product.discounted_price < product.price
    ? product.discounted_price
    : product.price;
}

function ProductImage({
  imageUrl,
  alt,
  fallbackLabel,
}: {
  imageUrl?: string | null;
  alt: string;
  fallbackLabel: string;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const shouldShowFallback = !imageUrl || hasImageError;

  if (shouldShowFallback) {
    return (
      <Center
        h={132}
        style={{
          background:
            "linear-gradient(135deg, var(--mantine-color-orange-1), var(--mantine-color-yellow-0))",
        }}
      >
        <Stack align="center" gap={6}>
          <IconPhotoOff size={34} color="var(--mantine-color-orange-6)" />
          <Text size="sm" fw={600} c="orange.8">
            {fallbackLabel}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box
      component="img"
      src={imageUrl}
      alt={alt}
      h={132}
      w="100%"
      onError={() => {
        setHasImageError(true);
      }}
      style={{ objectFit: "cover", display: "block" }}
    />
  );
}

type CheckoutModalProps = {
  opened: boolean;
  onClose: () => void;
  companyId?: string;
  cartProducts: Product[];
  cartQuantities: Record<string, number>;
  onOrderCreated: () => void;
  partners: Partner[];
  partnersLoading: boolean;
  partnersError: Error | null;
  currentLanguage: string;
  isDark: boolean;
  initialPhone: string;
  supportedOrderTypes?: string[];
  paymentAcceptingStyle?: "non-o" | "o";
  cardPans?: string[];
};

function CheckoutModal({
  opened,
  onClose,
  companyId,
  cartProducts,
  cartQuantities,
  onOrderCreated,
  partners,
  partnersLoading,
  partnersError,
  currentLanguage,
  isDark,
  initialPhone,
  supportedOrderTypes = [],
  paymentAcceptingStyle = "o",
  cardPans = [],
}: CheckoutModalProps) {
  // Determine which order types to show based on company settings
  const showMyself = supportedOrderTypes.includes("delivery-anywhere");
  const showPartners = supportedOrderTypes.includes("delivery-to-organization");

  // Determine payment options based on payment_accepting_style
  const isO = paymentAcceptingStyle === "o";
  // Base payment types
  const basePayments: PaymentType[] = isO
    ? (["cash", "click", "payme"] as PaymentType[])
    : (["cash"] as PaymentType[]);
  // Add "card" option if cardPans are available
  const hasCardPans = cardPans && cardPans.length > 0;
  const availablePayments: PaymentType[] = hasCardPans
    ? [...basePayments, "card"]
    : basePayments;

  const { t } = useTranslation();
  const theme = useMantineTheme();
  const createOrderMutation = useCreateCompanyOrder();
  const [checkoutType, setCheckoutType] = useState<CheckoutType>("myself");
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [selectedCardPan, setSelectedCardPan] = useState<string>("");
  const [showCardPansModal, setShowCardPansModal] = useState(false);
  const [comment, setComment] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState(0);
  const [deliveryLongitude, setDeliveryLongitude] = useState(0);
  const selectedSurfaceBackground = isDark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(255, 243, 224, 0.72)";
  const surfaceBackground = isDark
    ? "linear-gradient(180deg, rgba(23,24,29,0.98), rgba(16,17,20,0.98))"
    : "linear-gradient(180deg, #fffaf4 0%, #fff 100%)";
  const sectionBackground = isDark
    ? "rgba(255,255,255,0.03)"
    : "rgba(255,255,255,0.82)";
  const mutedBackground = isDark
    ? "rgba(255,255,255,0.04)"
    : "rgba(250, 245, 238, 0.95)";
  const sectionBorder = isDark
    ? "1px solid rgba(255,255,255,0.08)"
    : "1px solid rgba(214, 146, 72, 0.18)";
  const activeBorder = `1px solid ${theme.colors.orange[5]}`;
  const heroBackground = isDark
    ? "radial-gradient(circle at top left, rgba(255,163,72,0.18), transparent 42%), linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
    : "radial-gradient(circle at top left, rgba(255,185,120,0.4), transparent 36%), linear-gradient(135deg, rgba(255,248,240,0.95), rgba(255,255,255,0.98))";
  const titleColor = isDark ? theme.white : theme.black;
  const selectedPartner =
    partners.find((partner) => partner.id === selectedPartnerId) ?? null;

  const getPartnerLabel = (partner: Partner) =>
    currentLanguage === "uz"
      ? partner.name_uz || partner.name_ru
      : partner.name_ru || partner.name_uz;

  const getPaymentLabel = (value: PaymentType) => {
    switch (value) {
      case "click":
        return t("createOrderPage.paymentClick");
      case "payme":
        return t("createOrderPage.paymentPayme");
      case "card":
        // Show selected card pan or hint to click for more options
        if (selectedCardPan) {
          return selectedCardPan;
        }
        if (cardPans && cardPans.length > 1) {
          return `${cardPans[0]} +${cardPans.length - 1}`;
        }
        if (cardPans && cardPans.length > 0) {
          return cardPans[0];
        }
        return "Card";
      default:
        return t("createOrderPage.paymentCash");
    }
  };

  const handleCardClick = () => {
    if (cardPans && cardPans.length > 1) {
      // Show modal to select card if multiple cards available
      setShowCardPansModal(true);
    } else if (cardPans && cardPans.length === 1) {
      // Single card - auto-select it
      setSelectedCardPan(cardPans[0]);
      setPaymentType("card");
    }
  };

  const handleSelectCardPan = (pan: string) => {
    setSelectedCardPan(pan);
    setPaymentType("card");
    setShowCardPansModal(false);
  };

  const handleCreateOrder = async () => {
    if (!companyId) {
      showErrorNotification({
        message: t("createOrderPage.companyRequired"),
      });
      return;
    }

    if (!hasCompleteUzbekistanPhone(phoneNumber)) {
      showErrorNotification({
        message: t("createOrderPage.phoneRequired"),
      });
      return;
    }

    if (checkoutType === "partners" && !selectedPartnerId) {
      showErrorNotification({
        message: t("createOrderPage.partnerRequired"),
      });
      return;
    }

    if (checkoutType === "myself" && !deliveryAddress.trim()) {
      showErrorNotification({
        message: t("createOrderPage.addressRequired"),
      });
      return;
    }

    if (!cartProducts.length) {
      showErrorNotification({
        message: t("createOrderPage.cartRequired"),
      });
      return;
    }

    const payload: CreateCompanyOrderPayload = {
      company_id: companyId,
      partner_id: checkoutType === "partners" ? selectedPartnerId : undefined,
      phone_number: phoneNumber,
      delivery_address: checkoutType === "myself" ? deliveryAddress.trim() : "",
      comment: comment.trim(),
      payment_type: paymentType,
      items: cartProducts.map((product) => ({
        product_id: product.id,
        quantity: cartQuantities[product.id] ?? 0,
        price: getEffectivePrice(product),
      })),
    };

    try {
      await createOrderMutation.mutateAsync(payload);
      showSuccessNotification({
        message: t("createOrderPage.createSuccess"),
      });
      onOrderCreated();
      onClose();
    } catch (error) {
      showErrorNotification({
        message:
          error instanceof Error
            ? error.message
            : t("createOrderPage.createError"),
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      padding={0}
      withCloseButton={false}
      styles={{
        content: {
          background: surfaceBackground,
        },
        header: {
          display: "none",
        },
        body: {
          padding: 0,
        },
      }}
    >
      <Stack gap={0} h="100vh">
        <Box
          px={{ base: "md", sm: "xl" }}
          py={{ base: "md", sm: "lg" }}
          style={{
            borderBottom: sectionBorder,
            background: heroBackground,
          }}
        >
          <Group justify="space-between" align="flex-start" gap="md">
            <div>
              <Group gap="sm" mb={8}>
                <Badge color="orange" variant="filled" radius="xl">
                  {t("createOrderPage.checkoutModalTitle")}
                </Badge>
                <Badge variant="light" color="gray" radius="xl">
                  {cartProducts.length} items
                </Badge>
              </Group>
              <Title order={2} c={titleColor}>
                {t("createOrderPage.createOrder")}
              </Title>
              <Text c="dimmed" mt={6}>
                {t("createOrderPage.checkoutModalSubtitle")}
              </Text>
            </div>
            <Button variant="default" radius="xl" onClick={onClose}>
              {t("staffPage.cancel")}
            </Button>
          </Group>
        </Box>

        <Box style={{ flex: 1, overflow: "auto" }}>
          <SimpleGrid
            cols={{ base: 1, lg: 2 }}
            spacing="xl"
            px={{ base: "md", sm: "xl" }}
            py={{ base: "md", sm: "xl" }}
            verticalSpacing="xl"
          >
            <Stack gap="xl">
              <Card
                radius="xl"
                p="lg"
                style={{ background: sectionBackground, border: sectionBorder }}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <Center
                      w={42}
                      h={42}
                      style={{
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, var(--mantine-color-orange-5), var(--mantine-color-yellow-4))",
                        color: "white",
                      }}
                    >
                      <IconTruckDelivery size={20} />
                    </Center>
                    <div>
                      <Text fw={800}>
                        {t("createOrderPage.orderTypeTitle")}
                      </Text>
                    </div>
                  </Group>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    {showMyself && (
                      <Paper
                        component="button"
                        type="button"
                        radius="xl"
                        p="sm"
                        onClick={() => setCheckoutType("myself")}
                        style={{
                          textAlign: "left",
                          cursor: "pointer",
                          background:
                            checkoutType === "myself"
                              ? selectedSurfaceBackground
                              : mutedBackground,
                          border:
                            checkoutType === "myself"
                              ? activeBorder
                              : sectionBorder,
                          minHeight: 64,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                          w="100%"
                        >
                          <Group gap="sm" wrap="nowrap">
                            <Center
                              w={34}
                              h={34}
                              style={{
                                borderRadius: 999,
                                background:
                                  checkoutType === "myself"
                                    ? "rgba(255, 148, 66, 0.16)"
                                    : "transparent",
                                color: theme.colors.orange[5],
                                flexShrink: 0,
                              }}
                            >
                              <IconTruckDelivery size={18} />
                            </Center>
                            <Text fw={800}>
                              {t("createOrderPage.orderTypeMyself")}
                            </Text>
                          </Group>
                          {checkoutType === "myself" ? (
                            <IconCheck
                              size={18}
                              color={theme.colors.orange[5]}
                            />
                          ) : null}
                        </Group>
                      </Paper>
                    )}

                    {showPartners && (
                      <Paper
                        component="button"
                        type="button"
                        radius="xl"
                        p="sm"
                        onClick={() => setCheckoutType("partners")}
                        style={{
                          textAlign: "left",
                          cursor: "pointer",
                          background:
                            checkoutType === "partners"
                              ? selectedSurfaceBackground
                              : mutedBackground,
                          border:
                            checkoutType === "partners"
                              ? activeBorder
                              : sectionBorder,
                          minHeight: 64,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Group
                          justify="space-between"
                          align="center"
                          wrap="nowrap"
                          w="100%"
                        >
                          <Group gap="sm" wrap="nowrap">
                            <Center
                              w={34}
                              h={34}
                              style={{
                                borderRadius: 999,
                                background:
                                  checkoutType === "partners"
                                    ? "rgba(255, 148, 66, 0.16)"
                                    : "transparent",
                                color: theme.colors.orange[5],
                                flexShrink: 0,
                              }}
                            >
                              <IconBuildingStore size={18} />
                            </Center>
                            <Text fw={800}>
                              {t("createOrderPage.orderTypePartners")}
                            </Text>
                          </Group>
                          {checkoutType === "partners" ? (
                            <IconCheck
                              size={18}
                              color={theme.colors.orange[5]}
                            />
                          ) : null}
                        </Group>
                      </Paper>
                    )}
                  </SimpleGrid>

                  {checkoutType === "myself" ? (
                    <MapAddressPicker
                      address={deliveryAddress}
                      latitude={deliveryLatitude}
                      longitude={deliveryLongitude}
                      onChange={(value) => {
                        setDeliveryAddress(value.address);
                        setDeliveryLatitude(value.latitude);
                        setDeliveryLongitude(value.longitude);
                      }}
                    />
                  ) : (
                    <Stack gap="md">
                      {partnersError ? (
                        <Alert color="red" variant="light">
                          {partnersError.message ||
                            t("createOrderPage.partnerLoadError")}
                        </Alert>
                      ) : partnersLoading ? (
                        <Center py="xl">
                          <Loader />
                        </Center>
                      ) : (
                        <>
                          <PartnerMapPicker
                            partners={partners}
                            selectedPartnerId={selectedPartnerId}
                            onSelectPartner={setSelectedPartnerId}
                          />

                          <div>
                            <Group gap="sm" mb="xs">
                              <IconBuildingStore
                                size={18}
                                color={theme.colors.orange[5]}
                              />
                              <Text fw={700}>
                                {t("createOrderPage.partnerListTitle")}
                              </Text>
                            </Group>
                            <ScrollArea.Autosize mah={280}>
                              <Stack gap="sm">
                                {partners.map((partner) => {
                                  const isSelected =
                                    partner.id === selectedPartnerId;

                                  return (
                                    <Paper
                                      key={partner.id}
                                      withBorder
                                      radius="xl"
                                      p="md"
                                      component="button"
                                      type="button"
                                      onClick={() => {
                                        setSelectedPartnerId(partner.id);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        cursor: "pointer",
                                        background: isSelected
                                          ? selectedSurfaceBackground
                                          : mutedBackground,
                                        border: isSelected
                                          ? activeBorder
                                          : sectionBorder,
                                      }}
                                    >
                                      <Group
                                        justify="space-between"
                                        align="flex-start"
                                        wrap="nowrap"
                                      >
                                        <Stack gap={4} style={{ flex: 1 }}>
                                          <Text fw={800}>
                                            {getPartnerLabel(partner)}
                                          </Text>
                                          <Text size="sm" c="dimmed">
                                            {partner.address_description}
                                          </Text>
                                        </Stack>
                                        {isSelected ? (
                                          <Center
                                            w={28}
                                            h={28}
                                            style={{
                                              borderRadius: 999,
                                              background:
                                                theme.colors.orange[5],
                                              color: "white",
                                              flexShrink: 0,
                                            }}
                                          >
                                            <IconCheck size={16} />
                                          </Center>
                                        ) : null}
                                      </Group>
                                    </Paper>
                                  );
                                })}
                              </Stack>
                            </ScrollArea.Autosize>
                          </div>
                        </>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Card>

              <Card
                radius="xl"
                p="lg"
                style={{ background: sectionBackground, border: sectionBorder }}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <Center
                      w={42}
                      h={42}
                      style={{
                        borderRadius: 14,
                        background: mutedBackground,
                      }}
                    >
                      <IconCreditCard
                        size={20}
                        color={theme.colors.orange[5]}
                      />
                    </Center>
                    <div>
                      <Text fw={800}>{t("createOrderPage.paymentTitle")}</Text>
                    </div>
                  </Group>

                  <Radio.Group
                    value={paymentType}
                    onChange={(value) => {
                      if (value === "card") {
                        handleCardClick();
                      } else {
                        setPaymentType(value as PaymentType);
                      }
                    }}
                  >
                    <SimpleGrid
                      cols={{ base: 1, sm: availablePayments.length }}
                      spacing="md"
                    >
                      {availablePayments.map((value) => {
                        const active = paymentType === value;

                        return (
                          <Paper
                            key={value}
                            component="button"
                            type="button"
                            radius="xl"
                            p="md"
                            onClick={() => {
                              if (value === "card") {
                                handleCardClick();
                              } else {
                                setPaymentType(value);
                              }
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              cursor: "pointer",
                              background: active
                                ? selectedSurfaceBackground
                                : mutedBackground,
                              border: active ? activeBorder : sectionBorder,
                            }}
                          >
                            <Stack gap="sm">
                              <Group justify="space-between" wrap="nowrap">
                                <Radio
                                  value={value}
                                  label={getPaymentLabel(value)}
                                />
                                {active ? (
                                  <IconCheck
                                    size={18}
                                    color={theme.colors.orange[5]}
                                  />
                                ) : null}
                              </Group>
                            </Stack>
                          </Paper>
                        );
                      })}
                    </SimpleGrid>
                  </Radio.Group>

                  {/* Card PANs Selection Modal */}
                  <Modal
                    opened={showCardPansModal}
                    onClose={() => setShowCardPansModal(false)}
                    title={t("createOrderPage.selectCard") || "Select Card"}
                    centered
                  >
                    <Stack gap="sm">
                      {cardPans?.map((pan) => (
                        <Paper
                          key={pan}
                          component="button"
                          type="button"
                          radius="xl"
                          p="md"
                          onClick={() => handleSelectCardPan(pan)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            cursor: "pointer",
                            background:
                              selectedCardPan === pan
                                ? selectedSurfaceBackground
                                : mutedBackground,
                            border:
                              selectedCardPan === pan
                                ? activeBorder
                                : sectionBorder,
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Text fw={600}>{pan}</Text>
                            {selectedCardPan === pan ? (
                              <IconCheck
                                size={18}
                                color={theme.colors.orange[5]}
                              />
                            ) : null}
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Modal>
                </Stack>
              </Card>

              <Card
                radius="xl"
                p="lg"
                style={{ background: sectionBackground, border: sectionBorder }}
              >
                <Stack gap="md">
                  <Text fw={800}>{t("createOrderPage.phoneTitle")}</Text>
                  <PhoneNumberInput
                    label={t("createOrderPage.phoneLabel")}
                    placeholder="+998 90 123 45 67"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                  />
                  <Textarea
                    label={t("createOrderPage.commentLabel")}
                    placeholder={t("createOrderPage.commentPlaceholder")}
                    minRows={4}
                    value={comment}
                    onChange={(event) => {
                      setComment(event.currentTarget.value);
                    }}
                  />
                </Stack>
              </Card>
            </Stack>

            <Stack gap="xl">
              <Card
                radius="xl"
                p="lg"
                style={{
                  background: heroBackground,
                  border: sectionBorder,
                  position: "sticky",
                  top: 24,
                }}
              >
                <Stack gap="lg">
                  <Group gap="sm">
                    <Center
                      w={42}
                      h={42}
                      style={{
                        borderRadius: 14,
                        background:
                          "linear-gradient(135deg, var(--mantine-color-orange-5), var(--mantine-color-yellow-4))",
                        color: "white",
                      }}
                    >
                      <IconReceipt2 size={20} />
                    </Center>
                    <div>
                      <Text fw={800}>
                        {t("createOrderPage.selectionSummary")}
                      </Text>
                    </div>
                  </Group>

                  <Stack gap="sm">
                    <Paper
                      radius="lg"
                      p="md"
                      style={{ background: mutedBackground }}
                    >
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Delivery
                      </Text>
                      <Text fw={700} mt={6}>
                        {checkoutType === "myself"
                          ? t("createOrderPage.orderTypeMyself")
                          : t("createOrderPage.orderTypePartners")}
                      </Text>
                      <Text size="sm" c="dimmed" mt={4}>
                        {checkoutType === "myself"
                          ? deliveryAddress ||
                            t("createOrderPage.addressPlaceholder")
                          : selectedPartner
                            ? `${getPartnerLabel(selectedPartner)}${selectedPartner.address_description ? `, ${selectedPartner.address_description}` : ""}`
                            : t("createOrderPage.choosePartner")}
                      </Text>
                    </Paper>

                    <Paper
                      radius="lg"
                      p="md"
                      style={{ background: mutedBackground }}
                    >
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Contact
                      </Text>
                      <Text fw={700} mt={6}>
                        {phoneNumber || "+998"}
                      </Text>
                      {comment.trim() ? (
                        <Text size="sm" c="dimmed" mt={6}>
                          {t("createOrderPage.commentSummary", {
                            comment: comment.trim(),
                          })}
                        </Text>
                      ) : null}
                    </Paper>

                    <Paper
                      radius="lg"
                      p="md"
                      style={{ background: mutedBackground }}
                    >
                      <Text size="xs" tt="uppercase" fw={700} c="dimmed">
                        Payment
                      </Text>
                      <Text fw={700} mt={6}>
                        {getPaymentLabel(paymentType)}
                      </Text>
                    </Paper>
                  </Stack>

                  <Divider />

                  <Stack gap="sm">
                    {cartProducts.map((product) => {
                      const quantity = cartQuantities[product.id] ?? 0;
                      const itemTotal = getEffectivePrice(product) * quantity;

                      return (
                        <Group
                          key={`summary-${product.id}`}
                          justify="space-between"
                          align="flex-start"
                          wrap="nowrap"
                        >
                          <div style={{ flex: 1 }}>
                            <Text fw={700}>
                              {getProductName(product, currentLanguage)}
                            </Text>
                            <Text size="sm" c="dimmed">
                              {quantity} x{" "}
                              {formatPrice(
                                getEffectivePrice(product),
                                currentLanguage,
                              )}
                            </Text>
                          </div>
                          <Text fw={800}>
                            {formatPrice(itemTotal, currentLanguage)}
                          </Text>
                        </Group>
                      );
                    })}
                  </Stack>

                  <Paper
                    radius="xl"
                    p="md"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--mantine-color-orange-6), var(--mantine-color-yellow-5))",
                      color: "white",
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="xs" c="rgba(255,255,255,0.78)">
                          {t("createOrderPage.cartTotal")}
                        </Text>
                        <Text fw={900} size="xl">
                          {formatPrice(
                            cartProducts.reduce(
                              (sum, product) =>
                                sum +
                                getEffectivePrice(product) *
                                  (cartQuantities[product.id] ?? 0),
                              0,
                            ),
                            currentLanguage,
                          )}
                        </Text>
                      </div>
                      <Badge variant="white" color="dark" size="lg" radius="xl">
                        {cartProducts.reduce(
                          (sum, product) =>
                            sum + (cartQuantities[product.id] ?? 0),
                          0,
                        )}{" "}
                        items
                      </Badge>
                    </Group>
                  </Paper>
                </Stack>
              </Card>
            </Stack>
          </SimpleGrid>
        </Box>

        <Box
          px={{ base: "md", sm: "xl" }}
          py="md"
          style={{
            borderTop: sectionBorder,
            background: isDark
              ? "rgba(16,17,20,0.94)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Group justify="space-between" align="center">
            <Text fw={700} c="dimmed">
              {cartProducts.length} items
            </Text>
            <Group>
              <Button variant="default" radius="xl" onClick={onClose}>
                {t("staffPage.cancel")}
              </Button>
              <Button
                color="orange"
                radius="xl"
                size="md"
                leftSection={<IconReceipt2 size={18} />}
                loading={createOrderMutation.isPending}
                onClick={() => {
                  void handleCreateOrder();
                }}
              >
                {t("createOrderPage.createOrder")}
              </Button>
            </Group>
          </Group>
        </Box>
      </Stack>
    </Modal>
  );
}

export default function CreateOrderPage() {
  const { t, i18n } = useTranslation();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme("light");
  const isDark = computedColorScheme === "dark";
  const companyId = useAuthStore((state) => state.company?.id);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(
    {},
  );
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories(companyId, 1000, 1, "");
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(companyId, 1000, 1, "");
  const {
    data: partnersData,
    isLoading: partnersLoading,
    error: partnersError,
  } = usePartners(companyId, 500, 1, "");
  const { data: settingsData } = useCompanySettings(companyId ?? "");

  const currentLanguage = i18n.resolvedLanguage ?? "ru";
  const categories = [...(categoriesData?.categories ?? [])].sort(
    (left, right) => left.sort_order - right.sort_order,
  );
  const products = productsData?.products ?? [];
  const partners = partnersData?.partners ?? [];
  const activeProducts = products.filter((product) => product.is_available);
  const productsByCategory = new Map<string, Product[]>();

  for (const product of activeProducts) {
    const currentProducts = productsByCategory.get(product.category_id) ?? [];
    currentProducts.push(product);
    productsByCategory.set(product.category_id, currentProducts);
  }

  const visibleCategories = categories.filter(
    (category) => (productsByCategory.get(category.id) ?? []).length > 0,
  );
  const isLoading = categoriesLoading || productsLoading;
  const error = categoriesError ?? productsError;
  const cartProducts = activeProducts.filter(
    (product) => cartQuantities[product.id] > 0,
  );
  const cartItemsCount = cartProducts.reduce(
    (sum, product) => sum + (cartQuantities[product.id] ?? 0),
    0,
  );
  const cartTotalAmount = cartProducts.reduce(
    (sum, product) =>
      sum + getEffectivePrice(product) * (cartQuantities[product.id] ?? 0),
    0,
  );
  const cartPanelBackground = isDark
    ? `linear-gradient(180deg, ${theme.colors.dark[7]} 0%, ${theme.colors.dark[6]} 100%)`
    : "linear-gradient(180deg, rgba(255, 248, 240, 0.96), rgba(255, 255, 255, 0.98))";
  const cartPanelShadow = isDark
    ? "0 12px 28px rgba(0, 0, 0, 0.35)"
    : "0 12px 28px rgba(191, 110, 31, 0.08)";
  const emptyCartBackground = isDark
    ? "rgba(255, 255, 255, 0.03)"
    : "rgba(255, 243, 224, 0.55)";
  const emptyCartBorder = isDark
    ? `1px dashed ${theme.colors.orange[8]}`
    : "1px dashed var(--mantine-color-orange-3)";
  const emptyCartIconBackground = isDark
    ? "rgba(255, 165, 0, 0.18)"
    : "rgba(255, 165, 0, 0.12)";
  const cartItemBackground = isDark
    ? "rgba(255, 255, 255, 0.04)"
    : "rgba(255, 255, 255, 0.86)";
  const cartItemBorderColor = isDark
    ? "rgba(255, 177, 66, 0.22)"
    : "rgba(255, 177, 66, 0.35)";
  const cartItemPriceColor = isDark ? theme.white : theme.black;

  const addToCart = (productId: string) => {
    setCartQuantities((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  };

  const changeCartQuantity = (productId: string, nextQuantity: number) => {
    setCartQuantities((current) => {
      if (nextQuantity <= 0) {
        const nextCart = { ...current };
        delete nextCart[productId];
        return nextCart;
      }

      return {
        ...current,
        [productId]: nextQuantity,
      };
    });
  };

  const handleOrderCreated = () => {
    setCartQuantities({});
  };

  const openCheckoutModal = () => {
    if (!cartProducts.length) {
      return;
    }

    setIsCheckoutModalOpen(true);
  };

  return (
    <Stack gap="lg">
      <CheckoutModal
        opened={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
        }}
        companyId={companyId}
        cartProducts={cartProducts}
        cartQuantities={cartQuantities}
        onOrderCreated={handleOrderCreated}
        partners={partners}
        partnersLoading={partnersLoading}
        partnersError={partnersError ?? null}
        currentLanguage={currentLanguage}
        isDark={isDark}
        initialPhone=""
        supportedOrderTypes={settingsData?.supported_order_types ?? []}
        paymentAcceptingStyle={settingsData?.payment_accepting_style}
        cardPans={settingsData?.card_pans ?? []}
      />

      <div>
        <Title order={3}>{t("createOrderPage.title")}</Title>
        <Text c="dimmed">{t("createOrderPage.subtitle")}</Text>
      </div>

      {error ? (
        <Alert color="red" variant="light">
          {error.message || t("createOrderPage.loadError")}
        </Alert>
      ) : isLoading ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Loader />
            <Text c="dimmed">{t("createOrderPage.loading")}</Text>
          </Stack>
        </Center>
      ) : visibleCategories.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 320px",
            gap: "20px",
            alignItems: "flex-start",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Stack gap="xl">
              {visibleCategories.map((category) => {
                const categoryProducts =
                  productsByCategory.get(category.id) ?? [];

                return (
                  <Stack key={category.id} gap="md">
                    <div>
                      <Title order={4}>
                        {currentLanguage === "uz"
                          ? category.name_uz
                          : category.name_ru}
                      </Title>
                      <Text size="sm" c="dimmed">
                        {t("createOrderPage.productCount", {
                          count: categoryProducts.length,
                        })}
                      </Text>
                    </div>

                    <SimpleGrid
                      cols={{ base: 2, sm: 2, lg: 3, xl: 4 }}
                      spacing="md"
                    >
                      {categoryProducts.map((product) => {
                        const discountPercent = getDiscountPercent(
                          product.price,
                          product.discounted_price,
                        );
                        const hasDiscount = discountPercent !== null;

                        return (
                          <Card key={product.id} withBorder radius="lg" p="sm">
                            <Card.Section>
                              <ProductImage
                                imageUrl={product.image_url}
                                alt={getProductName(product, currentLanguage)}
                                fallbackLabel={t("createOrderPage.noImage")}
                              />
                            </Card.Section>

                            <Stack gap="xs" mt="sm">
                              <Group
                                justify="space-between"
                                align="start"
                                wrap="nowrap"
                              >
                                <Text fw={700} size="sm" lineClamp={2}>
                                  {getProductName(product, currentLanguage)}
                                </Text>
                                {hasDiscount ? (
                                  <Badge color="red" variant="light" size="sm">
                                    -{discountPercent}%
                                  </Badge>
                                ) : null}
                              </Group>

                              <Divider />

                              <Stack gap={4}>
                                {hasDiscount ? (
                                  <Text size="xs" td="line-through" c="dimmed">
                                    {formatPrice(
                                      product.price,
                                      currentLanguage,
                                    )}
                                  </Text>
                                ) : null}
                                <Text
                                  fw={800}
                                  size="md"
                                  c={hasDiscount ? "red" : undefined}
                                >
                                  {formatPrice(
                                    getEffectivePrice(product),
                                    currentLanguage,
                                  )}
                                </Text>
                              </Stack>

                              <Button
                                fullWidth
                                radius="md"
                                color="orange"
                                size="sm"
                                leftSection={<IconShoppingCart size={16} />}
                                onClick={() => {
                                  addToCart(product.id);
                                }}
                              >
                                {t("createOrderPage.addToCart")}
                              </Button>
                            </Stack>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                  </Stack>
                );
              })}
            </Stack>
          </div>

          <div style={{ minWidth: 0 }}>
            <Card
              withBorder
              radius="lg"
              p="sm"
              style={{
                position: "sticky",
                top: 16,
                background: cartPanelBackground,
                boxShadow: cartPanelShadow,
                overflow: "hidden",
              }}
            >
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Group gap="sm" wrap="nowrap">
                    <Center
                      w={30}
                      h={30}
                      style={{
                        borderRadius: 999,
                        background:
                          "linear-gradient(135deg, var(--mantine-color-orange-5), var(--mantine-color-yellow-4))",
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      <IconShoppingCart size={16} />
                    </Center>
                    <div>
                      <Text fw={700} size="sm">
                        {t("createOrderPage.cartTitle")}
                      </Text>
                      <Text size="10px" c="dimmed">
                        {t("createOrderPage.cartItems", {
                          count: cartItemsCount,
                        })}
                      </Text>
                    </div>
                  </Group>
                  <Badge color="orange" variant="filled" radius="xl" size="sm">
                    {t("createOrderPage.cartItems", { count: cartItemsCount })}
                  </Badge>
                </Group>

                {!cartProducts.length ? (
                  <Center
                    py="md"
                    px="sm"
                    style={{
                      borderRadius: 14,
                      border: emptyCartBorder,
                      background: emptyCartBackground,
                    }}
                  >
                    <Stack align="center" gap="xs">
                      <Center
                        w={34}
                        h={34}
                        style={{
                          borderRadius: 999,
                          background: emptyCartIconBackground,
                          color: "var(--mantine-color-orange-7)",
                        }}
                      >
                        <IconShoppingCart size={16} />
                      </Center>
                      <Text fw={600} size="xs">
                        {t("createOrderPage.cartEmpty")}
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <>
                    <Stack gap="xs">
                      {cartProducts.map((product) => {
                        const quantity = cartQuantities[product.id] ?? 0;
                        const effectivePrice = getEffectivePrice(product);
                        const hasDiscount = effectivePrice !== product.price;

                        return (
                          <Card
                            key={product.id}
                            withBorder
                            radius="lg"
                            p="xs"
                            style={{
                              background: cartItemBackground,
                              borderColor: cartItemBorderColor,
                            }}
                          >
                            <Stack gap={6}>
                              <Group
                                justify="space-between"
                                align="flex-start"
                                wrap="nowrap"
                              >
                                <Text
                                  fw={600}
                                  size="xs"
                                  lineClamp={2}
                                  style={{ flex: 1 }}
                                >
                                  {getProductName(product, currentLanguage)}
                                </Text>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="sm"
                                  onClick={() => {
                                    changeCartQuantity(product.id, 0);
                                  }}
                                  aria-label={t(
                                    "createOrderPage.removeFromCart",
                                  )}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>

                              <Stack gap={2}>
                                {hasDiscount ? (
                                  <Text
                                    size="10px"
                                    td="line-through"
                                    c="dimmed"
                                  >
                                    {formatPrice(
                                      product.price,
                                      currentLanguage,
                                    )}
                                  </Text>
                                ) : null}
                                <Text
                                  fw={700}
                                  size="sm"
                                  c={hasDiscount ? "red" : cartItemPriceColor}
                                >
                                  {formatPrice(effectivePrice, currentLanguage)}
                                </Text>
                              </Stack>

                              <Group justify="space-between" align="center">
                                <Group gap="xs" wrap="nowrap">
                                  <ActionIcon
                                    variant="light"
                                    color="orange"
                                    size="sm"
                                    onClick={() => {
                                      changeCartQuantity(
                                        product.id,
                                        quantity - 1,
                                      );
                                    }}
                                    aria-label={t(
                                      "createOrderPage.decreaseQuantity",
                                    )}
                                  >
                                    <IconMinus size={16} />
                                  </ActionIcon>
                                  <Badge
                                    variant="filled"
                                    color="gray"
                                    size="sm"
                                    radius="md"
                                    miw={34}
                                  >
                                    {quantity}
                                  </Badge>
                                  <ActionIcon
                                    variant="light"
                                    color="orange"
                                    size="sm"
                                    onClick={() => {
                                      changeCartQuantity(
                                        product.id,
                                        quantity + 1,
                                      );
                                    }}
                                    aria-label={t(
                                      "createOrderPage.increaseQuantity",
                                    )}
                                  >
                                    <IconPlus size={16} />
                                  </ActionIcon>
                                </Group>
                                <Stack gap={0} align="flex-end">
                                  <Text size="10px" c="dimmed">
                                    {t("createOrderPage.cartSubtotal")}
                                  </Text>
                                  <Text fw={800} size="sm">
                                    {formatPrice(
                                      effectivePrice * quantity,
                                      currentLanguage,
                                    )}
                                  </Text>
                                </Stack>
                              </Group>
                            </Stack>
                          </Card>
                        );
                      })}
                    </Stack>

                    <Card
                      radius="lg"
                      p="sm"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--mantine-color-orange-6), var(--mantine-color-yellow-5))",
                        color: "white",
                      }}
                    >
                      <Group justify="space-between" align="center">
                        <div>
                          <Text size="10px" c="rgba(255,255,255,0.78)">
                            {t("createOrderPage.cartTotal")}
                          </Text>
                          <Text fw={800} size="lg">
                            {formatPrice(cartTotalAmount, currentLanguage)}
                          </Text>
                        </div>
                        <Badge
                          variant="white"
                          color="dark"
                          radius="xl"
                          size="sm"
                          styles={{ label: { fontWeight: 700 } }}
                        >
                          {t("createOrderPage.cartItems", {
                            count: cartItemsCount,
                          })}
                        </Badge>
                      </Group>
                    </Card>

                    <Button
                      fullWidth
                      radius="md"
                      color="orange"
                      variant="filled"
                      disabled={!cartProducts.length}
                      onClick={openCheckoutModal}
                    >
                      {t("createOrderPage.openCheckout")}
                    </Button>
                  </>
                )}
              </Stack>
            </Card>
          </div>
        </div>
      ) : (
        <Alert color="orange" variant="light">
          {t("createOrderPage.empty")}
        </Alert>
      )}
    </Stack>
  );
}
