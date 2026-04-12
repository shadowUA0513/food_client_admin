import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  Pagination,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import { useCategories } from "../../service/categories";
import {
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from "../../service/products";
import { useAuthStore } from "../../store/auth";
import type { Product } from "../../types/products";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

const ITEMS_PER_PAGE = 10;

export default function ProductPage() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.company?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState<
    string | null
  >(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  const { data: categoriesData } = useCategories(companyId, 1000, 1, "");
  const { data, isLoading, error } = useProducts(
    companyId,
    ITEMS_PER_PAGE,
    page,
    debouncedSearch.trim(),
    categoryId,
  );
  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();

  const products = data?.products ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  const categoryMap = new Map(
    (categoriesData?.categories ?? []).map((category) => [
      category.id,
      category,
    ]),
  );
  const categoryOptions = (categoriesData?.categories ?? []).map(
    (category) => ({
      value: category.id,
      label: `${category.name_uz} / ${category.name_ru}`,
    }),
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleOpenDelete = (product: Product) => {
    setSelectedProduct(product);
    openDelete();
  };

  const handleCloseDelete = () => {
    closeDelete();
    setSelectedProduct(null);
  };

  const handleDelete = async () => {
    if (!selectedProduct || !companyId) {
      return;
    }

    try {
      setDeletingId(selectedProduct.id);
      await deleteProductMutation.mutateAsync(selectedProduct.id);
      await queryClient.invalidateQueries({
        queryKey: ["products", companyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["product", companyId, selectedProduct.id],
      });
      showSuccessNotification({
        message: t("companyDetails.productDeleteSuccess"),
      });
      handleCloseDelete();
    } catch (deleteError) {
      showErrorNotification({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : t("companyDetails.productDeleteError"),
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleAvailabilityChange = async (
    product: Product,
    isAvailable: boolean,
  ) => {
    try {
      setUpdatingAvailabilityId(product.id);
      await updateProductMutation.mutateAsync({
        id: product.id,
        payload: {
          company_id: product.company_id,
          category_id: product.category_id,
          name_ru: product.name_ru,
          name_uz: product.name_uz,
          description: product.description,
          price: product.price,
          discounted_price: product.discounted_price ?? 0,
          image_url: product.image_url,
          stock_quantity: product.stock_quantity,
          is_available: isAvailable,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: ["products", companyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["product", companyId, product.id],
      });
      showSuccessNotification({
        message: t("companyDetails.productUpdateSuccess"),
      });
    } catch (updateError) {
      showErrorNotification({
        message:
          updateError instanceof Error
            ? updateError.message
            : t("companyDetails.productUpdateError"),
      });
    } finally {
      setUpdatingAvailabilityId(null);
    }
  };

  return (
    <Stack gap="lg">
      <Outlet />

      <Modal
        opened={deleteOpened}
        onClose={handleCloseDelete}
        title={t("companyDetails.deleteProduct")}
        centered
      >
        <Stack gap="md">
          <Text>
            {t("companyDetails.deleteProductConfirmation")}{" "}
            <Text span fw={700}>
              {selectedProduct?.name_uz}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDelete}>
              {t("staffPage.cancel")}
            </Button>
            <Button
              color="red"
              loading={
                deleteProductMutation.isPending &&
                deletingId === selectedProduct?.id
              }
              onClick={() => {
                void handleDelete();
              }}
            >
              {t("companyDetails.deleteProduct")}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <div>
          <Title order={3}>{t("companyDetails.productTitle")}</Title>
          <Text c="dimmed">{t("companyDetails.productSubtitle")}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            navigate("/product/add");
          }}
        >
          {t("companyDetails.addProduct")}
        </Button>
      </Group>

      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="end">
          <TextInput
            label={t("companyDetails.search")}
            placeholder={t("companyDetails.searchProducts")}
            value={search}
            onChange={(event) => {
              setSearch(event.currentTarget.value);
            }}
            leftSection={<IconSearch size={16} />}
            styles={{
              label: {
                marginBottom: 8,
              },
            }}
            style={{ flex: 1 }}
          />
          <Select
            label={t("companyDetails.category")}
            placeholder={t("companyDetails.allCategories")}
            data={categoryOptions}
            value={categoryId}
            onChange={setCategoryId}
            clearable
            searchable
            style={{ minWidth: 260 }}
          />
          <Text size="sm" c="dimmed">
            {totalCount} {t("companyDetails.items")}
          </Text>
        </Group>
      </Card>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack align="center" py="xl" gap="sm">
            <Alert color="red" variant="light" w="100%">
              {error.message || t("companyDetails.productLoadError")}
            </Alert>
            <Button
              variant="light"
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["products", companyId],
                });
              }}
            >
              {t("staffPage.retry")}
            </Button>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">{t("companyDetails.productLoading")}</Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table.ScrollContainer minWidth={1100}>
              <Table highlightOnHover verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("companyDetails.productNameUz")}</Table.Th>
                    <Table.Th>{t("companyDetails.productNameRu")}</Table.Th>
                    <Table.Th>{t("companyDetails.categoryTitle")}</Table.Th>
                    <Table.Th>{t("companyDetails.price")}</Table.Th>
                    <Table.Th>{t("companyDetails.discountedPrice")}</Table.Th>
                    <Table.Th style={{ minWidth: 110 }}>
                      {t("companyDetails.productStockQuantity")}
                    </Table.Th>
                    <Table.Th>{t("companyDetails.productAvailable")}</Table.Th>
                    <Table.Th>{t("staffPage.actions")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {products.length ? (
                    products.map((product) => (
                      <Table.Tr key={product.id}>
                        <Table.Td>
                          <Text fw={600}>{product.name_uz}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c="dimmed">{product.name_ru}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c="dimmed">
                            {categoryMap.get(product.category_id)?.name_uz ??
                              product.category_id}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="orange" variant="light">
                            {product.price}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color="grape" variant="light">
                            {product.discounted_price ?? 0}
                          </Badge>
                        </Table.Td>
                        <Table.Td style={{ minWidth: 110 }}>
                          <Badge color="blue" variant="light">
                            {product.stock_quantity}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Switch
                            checked={product.is_available}
                            disabled={updatingAvailabilityId === product.id}
                            onChange={(event) => {
                              const isChecked = event.currentTarget.checked;

                              void handleAvailabilityChange(product, isChecked);
                            }}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              aria-label={t("companyDetails.editProduct")}
                              onClick={() => {
                                navigate(`/product/edit/${product.id}`, {
                                  state: { product },
                                });
                              }}
                            >
                              <IconPencil size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              aria-label={t("companyDetails.deleteProduct")}
                              title={t("companyDetails.deleteProduct")}
                              disabled={deleteProductMutation.isPending}
                              onClick={() => {
                                handleOpenDelete(product);
                              }}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={8}>
                        <Text c="dimmed" ta="center" py="md">
                          {t("companyDetails.noProductsFound")}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            <Group justify="space-between" mt="lg">
              <Text size="sm" c="dimmed">
                {t("companyDetails.showing")}{" "}
                {totalCount ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}-
                {Math.min(page * ITEMS_PER_PAGE, totalCount)}{" "}
                {t("companyDetails.of")} {totalCount}
              </Text>
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          </>
        )}
      </Card>
    </Stack>
  );
}
