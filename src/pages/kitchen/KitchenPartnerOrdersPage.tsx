import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconBrandTelegram,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconRefresh,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useKitchenRealtime } from "../../hooks/useKitchenRealtime";
import {
  useCancelKitchenOrder,
  useEditKitchenOrder,
  useKitchenOrders,
  useUpdateKitchenOrderStatus,
} from "../../service/kitchen";
import { useProducts } from "../../service/products";
import { useAuthStore } from "../../store/auth";
import type {
  KitchenOrder,
  KitchenOrderUpdatePayload,
} from "../../types/kitchen";
import type { Product } from "../../types/products";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

type EditableOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
};

type EditOrderForm = {
  partner_id: string;
  user_id: number;
  delivery_address: string;
  comment: string;
  payment_type: string;
  items: EditableOrderItem[];
};

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
      product.name_uz || product.name_ru || "",
    ]),
  );
}

function getOrderPhoneNumber(order: KitchenOrder) {
  return (
    order.phone_number || order.user_phone_number || order.user_phone || ""
  );
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

function createOrderEditForm(order: KitchenOrder): EditOrderForm {
  return {
    partner_id: order.partner_id,
    user_id: order.user_id,
    delivery_address: order.delivery_address || "",
    comment: order.comment || "",
    payment_type: order.payment_type || "cash",
    items:
      order.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })) || [],
  };
}

function normalizeNumberValue(
  value: string | number | null | undefined,
  fallback = 0,
) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function OrderCard({
  order,
  productMap,
  itemsLabel,
  phoneLabel,
  creatorLabel,
  paymentTypeLabel,
  addressLabel,
  commentLabel,
  closeLabel,
  closedLabel,
  editLabel,
  cancelLabel,
  cancelledLabel,
  onCloseOrder,
  onEditOrder,
  onCancelOrder,
  isClosing,
  isEditing,
  isCancelling,
}: {
  order: KitchenOrder;
  productMap: Map<string, string>;
  itemsLabel: string;
  phoneLabel: string;
  creatorLabel: string;
  paymentTypeLabel: string;
  addressLabel: string;
  commentLabel: string;
  closeLabel: string;
  closedLabel: string;
  editLabel: string;
  cancelLabel: string;
  cancelledLabel: string;
  onCloseOrder: (order: KitchenOrder) => void;
  onEditOrder: (order: KitchenOrder) => void;
  onCancelOrder: (order: KitchenOrder) => void;
  isClosing: boolean;
  isEditing: boolean;
  isCancelling: boolean;
}) {
  const { t } = useTranslation();
  const hasCreatorName = Boolean(order.creator_name?.trim());
  const hasPaymentType = Boolean(order.payment_type?.trim());
  const telegramScreenshotLink = order.tg_payment_screenshot_link?.trim() || "";
  const hasTelegramScreenshotLink = Boolean(telegramScreenshotLink);
  const hasAddress = Boolean(order.delivery_address?.trim());
  const hasComment = Boolean(order.comment?.trim());
  const phoneNumber = getOrderPhoneNumber(order);
  const hasPhoneNumber = Boolean(phoneNumber.trim());
  const status = order.status.toLowerCase();
  const isClosed = status === "closed";
  const isCancelled = status === "cancelled";
  const isActionLocked = isClosed || isCancelled;

  return (
    <Card
      withBorder
      radius="lg"
      p="md"
      style={{
        borderWidth: 3,
      }}
    >
      <Stack h="100%" gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" c="dimmed">
              {formatDate(order.created_at)}
            </Text>
          </div>
          <Badge
            color="dark"
            variant="light"
            size="md"
            styles={{
              root: {
                whiteSpace: "nowrap",
                flexShrink: 0,
                maxWidth: "100%",
                height: "auto",
                minHeight: 28,
                display: "inline-flex",
                alignItems: "center",
                overflow: "visible",
                paddingTop: 4,
                paddingBottom: 4,
              },
              label: {
                lineHeight: 1.2,
                overflow: "visible",
              },
            }}
          >
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
              {itemsLabel}
            </Text>
            <Text size="sm" c="dimmed">
              {order.items.length}
            </Text>
          </Group>
          <Stack gap="xs">
            {order.items.map((item) => (
              <Group
                key={item.id}
                justify="space-between"
                align="center"
                gap="sm"
              >
                <Text size="sm" style={{ flex: 1 }} lineClamp={2}>
                  {productMap.get(item.product_id) ||
                    t("kitchenPage.unknownProduct")}
                </Text>
                <Text size="sm" fw={600} c="dimmed">
                  x {item.quantity}
                </Text>
              </Group>
            ))}
          </Stack>
        </div>

        {(hasCreatorName ||
          hasPaymentType ||
          hasPhoneNumber ||
          hasAddress ||
          hasComment) && (
          <Stack gap="xs">
            {hasCreatorName ? (
              <div>
                <Text size="xs" fw={600} c="dimmed">
                  {creatorLabel}
                </Text>
                <Text size="sm">{order.creator_name}</Text>
              </div>
            ) : null}
            {hasPaymentType ? (
              <div>
                <Text size="xs" fw={600} c="dimmed">
                  {paymentTypeLabel}
                </Text>
                <Text size="sm">
                  {getTranslatedPaymentType(t, order.payment_type)}
                </Text>
              </div>
            ) : null}
            {hasPhoneNumber ? (
              <div>
                <Text size="xs" fw={600} c="dimmed">
                  {phoneLabel}
                </Text>
                <Text size="sm">{phoneNumber}</Text>
              </div>
            ) : null}
            {hasAddress ? (
              <div>
                <Text size="xs" fw={600} c="dimmed">
                  {addressLabel}
                </Text>
                <Text size="sm">{order.delivery_address}</Text>
              </div>
            ) : null}
            {hasComment ? (
              <div>
                <Text size="xs" fw={600} c="dimmed">
                  {commentLabel}
                </Text>
                <Text size="sm">{order.comment}</Text>
              </div>
            ) : null}
          </Stack>
        )}

        <Group gap="xs" wrap="wrap">
          <Badge
            variant="light"
            color={isClosed ? "green" : isCancelled ? "red" : "blue"}
            styles={{
              root: {
                whiteSpace: "nowrap",
                height: "auto",
                minHeight: 26,
                display: "inline-flex",
                alignItems: "center",
                overflow: "visible",
                paddingTop: 3,
                paddingBottom: 3,
              },
              label: {
                lineHeight: 1.2,
                overflow: "visible",
              },
            }}
          >
            {getTranslatedOrderStatus(t, order.status)}
          </Badge>
          <Badge
            variant="light"
            color="gray"
            styles={{
              root: {
                whiteSpace: "nowrap",
                height: "auto",
                minHeight: 26,
                display: "inline-flex",
                alignItems: "center",
                overflow: "visible",
                paddingTop: 3,
                paddingBottom: 3,
              },
              label: {
                lineHeight: 1.2,
                overflow: "visible",
              },
            }}
          >
            {getTranslatedPaymentStatus(t, order.payment_status)}
          </Badge>
        </Group>

        <Stack mt="auto" gap="xs">
          <Button
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

          <Button
            fullWidth
            radius="md"
            variant={isClosed ? "default" : "light"}
            color={isClosed ? "gray" : "orange"}
            loading={isClosing}
            disabled={isActionLocked}
            onClick={() => {
              onCloseOrder(order);
            }}
          >
            {isClosed ? closedLabel : closeLabel}
          </Button>

          <Button
            radius="md"
            variant="light"
            color="blue"
            leftSection={<IconPencil size={16} />}
            loading={isEditing}
            disabled={isActionLocked}
            onClick={() => {
              onEditOrder(order);
            }}
          >
            {editLabel}
          </Button>
          <Button
            radius="md"
            variant={isCancelled ? "default" : "light"}
            color={isCancelled ? "gray" : "red"}
            leftSection={<IconX size={16} />}
            loading={isCancelling}
            disabled={isActionLocked}
            onClick={() => {
              onCancelOrder(order);
            }}
          >
            {isCancelled ? cancelledLabel : cancelLabel}
          </Button>
        </Stack>
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
  useKitchenRealtime(company?.id);
  const { data: productsData } = useProducts(company?.id, 500, 1);
  const updateOrderStatusMutation = useUpdateKitchenOrderStatus();
  const cancelOrderMutation = useCancelKitchenOrder();
  const editOrderMutation = useEditKitchenOrder();
  const [editingOrder, setEditingOrder] = useState<KitchenOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<KitchenOrder | null>(null);
  const [editForm, setEditForm] = useState<EditOrderForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const products = productsData?.products ?? [];
  const partners = data?.partners ?? [];
  const selectedPartner = partners.find(
    (partner) => partner.partner_id === partnerId,
  );
  const productMap = getProductMap(products);
  const productOptions = products.map((product) => ({
    value: product.id,
    label:
      product.name_uz || product.name_ru || t("kitchenPage.unknownProduct"),
  }));
  const paymentTypeOptions = [
    { value: "cash", label: t("kitchenPage.paymentCash") },
    { value: "click", label: t("kitchenPage.paymentClick") },
    { value: "payme", label: t("kitchenPage.paymentPayme") },
  ];

  const refreshOrders = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["kitchen-orders", company?.id],
    });
  };

  const handleCloseOrder = async (order: KitchenOrder) => {
    const status = order.status.toLowerCase();

    if (!company?.id || status === "closed" || status === "cancelled") {
      return;
    }

    try {
      await updateOrderStatusMutation.mutateAsync({
        companyId: company.id,
        order_id: order.id,
        status: "closed",
      });
      await refreshOrders();
      showSuccessNotification({
        message: t("kitchenPage.closeSuccess"),
      });
    } catch (closeError) {
      showErrorNotification({
        message:
          closeError instanceof Error
            ? closeError.message
            : t("kitchenPage.closeError"),
      });
    }
  };

  const handleCancelOrder = async (order: KitchenOrder) => {
    const status = order.status.toLowerCase();

    if (!company?.id || status === "closed" || status === "cancelled") {
      return;
    }

    try {
      await cancelOrderMutation.mutateAsync({
        companyId: company.id,
        orderId: order.id,
      });
      await refreshOrders();
      setOrderToCancel(null);
      showSuccessNotification({
        message: t("kitchenPage.cancelSuccess"),
      });
    } catch (cancelError) {
      showErrorNotification({
        message:
          cancelError instanceof Error
            ? cancelError.message
            : t("kitchenPage.cancelError"),
      });
    }
  };

  const openCancelModal = (order: KitchenOrder) => {
    const status = order.status.toLowerCase();

    if (status === "closed" || status === "cancelled") {
      return;
    }

    setOrderToCancel(order);
  };

  const openEditModal = (order: KitchenOrder) => {
    if (
      order.status.toLowerCase() === "closed" ||
      order.status.toLowerCase() === "cancelled"
    ) {
      return;
    }

    setEditingOrder(order);
    setEditForm(createOrderEditForm(order));
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setEditForm(null);
    setEditError(null);
  };

  const updateEditItem = (
    index: number,
    field: keyof EditableOrderItem,
    value: string | number | null | undefined,
  ) => {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      const nextItems = current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "product_id"
                  ? String(value || "")
                  : normalizeNumberValue(value),
            }
          : item,
      );

      return {
        ...current,
        items: nextItems,
      };
    });
    setEditError(null);
  };

  const addEditItem = () => {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      const fallbackProduct = products[0];

      return {
        ...current,
        items: [
          ...current.items,
          {
            product_id: fallbackProduct?.id || "",
            quantity: 1,
            price: fallbackProduct?.price || 0,
          },
        ],
      };
    });
    setEditError(null);
  };

  const removeEditItem = (index: number) => {
    setEditForm((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        items: current.items.filter((_, itemIndex) => itemIndex !== index),
      };
    });
    setEditError(null);
  };

  const validateEditForm = (form: EditOrderForm) => {
    if (!form.items.length) {
      return t("kitchenPage.itemRequired");
    }

    for (const item of form.items) {
      if (!item.product_id) {
        return t("kitchenPage.productRequired");
      }

      if (item.quantity <= 0) {
        return t("kitchenPage.quantityRequired");
      }

      if (item.price <= 0) {
        return t("kitchenPage.priceRequired");
      }
    }

    return null;
  };

  const handleSaveOrder = async () => {
    if (!company?.id || !editingOrder || !editForm) {
      return;
    }

    const validationError = validateEditForm(editForm);

    if (validationError) {
      setEditError(validationError);
      return;
    }

    const payload: KitchenOrderUpdatePayload = {
      company_id: company.id,
      partner_id: editForm.partner_id,
      user_id: editForm.user_id,
      delivery_address: editForm.delivery_address,
      comment: editForm.comment,
      payment_type: editForm.payment_type,
      items: editForm.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      await editOrderMutation.mutateAsync({
        companyId: company.id,
        orderId: editingOrder.id,
        payload,
      });
      await refreshOrders();
      showSuccessNotification({
        message: t("kitchenPage.editSuccess"),
      });
      closeEditModal();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : t("kitchenPage.editError");

      setEditError(message);
      showErrorNotification({ message });
    }
  };

  return (
    <>
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
              void refreshOrders();
            }}
          >
            {t("commonActions.refresh")}
          </Button>
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
                    void refreshOrders();
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
                <OrderCard
                  key={order.id}
                  order={order}
                  productMap={productMap}
                  itemsLabel={t("kitchenPage.itemsLabel")}
                  phoneLabel={t("kitchenPage.phoneLabel")}
                  creatorLabel={t("kitchenPage.creatorLabel")}
                  paymentTypeLabel={t("kitchenPage.paymentTypeLabel")}
                  addressLabel={t("kitchenPage.addressLabel")}
                  commentLabel={t("kitchenPage.commentLabel")}
                  closeLabel={t("kitchenPage.closeOrder")}
                  closedLabel={t("kitchenPage.closedOrder")}
                  editLabel={t("kitchenPage.editOrder")}
                  cancelLabel={t("kitchenPage.cancelOrder")}
                  cancelledLabel={t("kitchenPage.cancelledOrder")}
                  onCloseOrder={(currentOrder) => {
                    void handleCloseOrder(currentOrder);
                  }}
                  onEditOrder={openEditModal}
                  onCancelOrder={(currentOrder) => {
                    openCancelModal(currentOrder);
                  }}
                  isClosing={
                    updateOrderStatusMutation.isPending &&
                    updateOrderStatusMutation.variables?.order_id === order.id
                  }
                  isEditing={
                    editOrderMutation.isPending && editingOrder?.id === order.id
                  }
                  isCancelling={
                    cancelOrderMutation.isPending &&
                    cancelOrderMutation.variables?.orderId === order.id
                  }
                />
              ))}
            </SimpleGrid>
          )}
        </Card>
      </Stack>

      <Modal
        opened={Boolean(editingOrder && editForm)}
        onClose={closeEditModal}
        title={t("kitchenPage.editModalTitle")}
        size="xl"
        centered
      >
        {editForm ? (
          <Stack gap="md">
            <Select
              label={t("kitchenPage.paymentTypeLabel")}
              placeholder={t("kitchenPage.paymentTypePlaceholder")}
              data={paymentTypeOptions}
              value={editForm.payment_type}
              onChange={(value) => {
                setEditForm((current) =>
                  current
                    ? {
                        ...current,
                        payment_type: value || "cash",
                      }
                    : current,
                );
                setEditError(null);
              }}
              allowDeselect={false}
            />

            <Textarea
              label={t("kitchenPage.addressLabel")}
              value={editForm.delivery_address}
              onChange={(event) => {
                const value = event.currentTarget.value;

                setEditForm((current) =>
                  current
                    ? {
                        ...current,
                        delivery_address: value,
                      }
                    : current,
                );
                setEditError(null);
              }}
              autosize
              minRows={2}
            />

            <Textarea
              label={t("kitchenPage.commentLabel")}
              value={editForm.comment}
              onChange={(event) => {
                const value = event.currentTarget.value;

                setEditForm((current) =>
                  current
                    ? {
                        ...current,
                        comment: value,
                      }
                    : current,
                );
                setEditError(null);
              }}
              autosize
              minRows={2}
            />

            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={600}>{t("kitchenPage.itemsEditorTitle")}</Text>
                <Button
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={addEditItem}
                  disabled={!productOptions.length}
                >
                  {t("kitchenPage.addItem")}
                </Button>
              </Group>

              {editForm.items.map((item, index) => (
                <Card
                  key={`${item.product_id}-${index}`}
                  withBorder
                  radius="lg"
                  p="sm"
                >
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start">
                      <Text fw={500}>
                        {t("kitchenPage.itemsLabel")} #{index + 1}
                      </Text>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => {
                          removeEditItem(index);
                        }}
                        disabled={editForm.items.length === 1}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>

                    <Select
                      label={t("kitchenPage.productLabel")}
                      data={productOptions}
                      value={item.product_id}
                      onChange={(value) => {
                        updateEditItem(index, "product_id", value);

                        const selectedProduct = products.find(
                          (product) => product.id === value,
                        );

                        if (selectedProduct) {
                          updateEditItem(index, "price", selectedProduct.price);
                        }
                      }}
                      searchable
                      allowDeselect={false}
                    />

                    <Group grow align="flex-start">
                      <NumberInput
                        label={t("kitchenPage.quantityLabel")}
                        value={item.quantity}
                        min={1}
                        allowDecimal={false}
                        onChange={(value) => {
                          updateEditItem(index, "quantity", value);
                        }}
                      />
                      <NumberInput
                        label={t("kitchenPage.priceLabel")}
                        value={item.price}
                        min={0}
                        allowDecimal={false}
                        thousandSeparator=" "
                        onChange={(value) => {
                          updateEditItem(index, "price", value);
                        }}
                      />
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>

            {editError ? (
              <Alert color="red" variant="light">
                {editError}
              </Alert>
            ) : null}

            <Group justify="flex-end">
              <Button variant="default" onClick={closeEditModal}>
                {t("staffPage.cancel")}
              </Button>
              <Button
                loading={editOrderMutation.isPending}
                onClick={() => {
                  void handleSaveOrder();
                }}
              >
                {t("kitchenPage.saveOrder")}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Modal
        opened={Boolean(orderToCancel)}
        onClose={() => {
          if (!cancelOrderMutation.isPending) {
            setOrderToCancel(null);
          }
        }}
        title={t("kitchenPage.cancelOrder")}
        centered
      >
        <Stack gap="md">
          <Text>{t("kitchenPage.cancelConfirmMessage")}</Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setOrderToCancel(null);
              }}
              disabled={cancelOrderMutation.isPending}
            >
              {t("staffPage.cancel")}
            </Button>
            <Button
              color="red"
              loading={cancelOrderMutation.isPending}
              onClick={() => {
                if (orderToCancel) {
                  void handleCancelOrder(orderToCancel);
                }
              }}
            >
              {t("kitchenPage.cancelOrder")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
