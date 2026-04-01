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
  Stack,
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
import { useCategories, useDeleteCategory } from "../../service/categories";
import { useAuthStore } from "../../store/auth";
import type { Category } from "../../types/categories";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

const ITEMS_PER_PAGE = 10;

export default function CategoryPage() {
  const { t } = useTranslation();
  const companyId = useAuthStore((state) => state.company?.id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);

  const { data, isLoading, error } = useCategories(
    companyId,
    ITEMS_PER_PAGE,
    page,
    debouncedSearch.trim(),
  );
  const deleteCategoryMutation = useDeleteCategory();

  const categories = data?.categories ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleOpenDelete = (category: Category) => {
    setSelectedCategory(category);
    openDelete();
  };

  const handleCloseDelete = () => {
    closeDelete();
    setSelectedCategory(null);
  };

  const handleDelete = async () => {
    if (!selectedCategory || !companyId) {
      return;
    }

    try {
      setDeletingId(selectedCategory.id);
      await deleteCategoryMutation.mutateAsync(selectedCategory.id);
      await queryClient.invalidateQueries({
        queryKey: ["categories", companyId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["category", companyId, selectedCategory.id],
      });
      showSuccessNotification({
        message: "Category deleted successfully.",
      });
      handleCloseDelete();
    } catch (deleteError) {
      showErrorNotification({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete category.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Stack gap="lg">
      <Outlet />

      <Modal
        opened={deleteOpened}
        onClose={handleCloseDelete}
        title="Delete category"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete{" "}
            <Text span fw={700}>
              {selectedCategory?.name_uz}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseDelete}>
              Cancel
            </Button>
            <Button
              color="red"
              loading={
                deleteCategoryMutation.isPending &&
                deletingId === selectedCategory?.id
              }
              onClick={() => {
                void handleDelete();
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <div>
          <Title order={3}>{t("companyDetails.categoryTitle")}</Title>
          <Text c="dimmed">{t("companyDetails.categorySubtitle")}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            navigate("/category/add");
          }}
        >
          {t("companyDetails.addCategory")}
        </Button>
      </Group>

      <Card withBorder radius="xl" p="lg">
        <Group justify="space-between" align="end">
          <TextInput
            label="Search"
            placeholder="Search categories"
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
          <Text size="sm" c="dimmed">
            {totalCount} items
          </Text>
        </Group>
      </Card>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack align="center" py="xl" gap="sm">
            <Alert color="red" variant="light" w="100%">
              {error.message || "Failed to load categories."}
            </Alert>
            <Button
              variant="light"
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["categories", companyId],
                });
              }}
            >
              Retry
            </Button>
          </Stack>
        ) : isLoading ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Loader />
              <Text c="dimmed">Loading categories...</Text>
            </Stack>
          </Center>
        ) : (
          <>
            <Table highlightOnHover verticalSpacing="md">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name UZ</Table.Th>
                  <Table.Th>Name RU</Table.Th>
                  <Table.Th>Sort order</Table.Th>
                  <Table.Th>Created at</Table.Th>
                  <Table.Th>{t("staffPage.actions")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {categories.length ? (
                  categories.map((category) => (
                    <Table.Tr key={category.id}>
                      <Table.Td>
                        <Text fw={600}>{category.name_uz}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">{category.name_ru}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="orange" variant="light">
                          {category.sort_order}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text c="dimmed">
                          {new Date(category.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            aria-label={t("companyDetails.editCategory")}
                            onClick={() => {
                              navigate(
                                `/category/edit/${category.id}`,
                                { state: { category } },
                              );
                            }}
                          >
                            <IconPencil size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            aria-label="Delete category"
                            title="Delete category"
                            disabled={deleteCategoryMutation.isPending}
                            onClick={() => {
                              handleOpenDelete(category);
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
                    <Table.Td colSpan={5}>
                      <Text c="dimmed" ta="center" py="md">
                        No categories found.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>

            <Group justify="space-between" mt="lg">
              <Text size="sm" c="dimmed">
                Showing {totalCount ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}-
                {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </Text>
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </Group>
          </>
        )}
      </Card>
    </Stack>
  );
}
