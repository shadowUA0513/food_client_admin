import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate } from "react-router-dom";
import { useDeleteStaffUser, useStaffUsers } from "../../service/staff";
import { useAuthStore } from "../../store/auth";
import type { StaffUser } from "../../types/staff";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

export default function StaffPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = useAuthStore((state) => state.company?.id);
  const [deleteOpened, { open: openDelete, close: closeDelete }] =
    useDisclosure(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);

  const { data, isLoading, error } = useStaffUsers();
  const deleteStaffMutation = useDeleteStaffUser();

  const filteredStaff = (data ?? []).filter(
    (member) =>
      member.company?.id === companyId || member.company_id === companyId,
  );

  const handleDeleteSuccess = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["staff-users", useAuthStore.getState().company?.id],
    });
    showSuccessNotification({
      message: "Staff member deleted successfully.",
    });
  };

  const deleteStaff = async (id: string) => {
    await deleteStaffMutation.mutateAsync(id, {
      onSuccess: handleDeleteSuccess,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteStaff(id);
      closeDelete();
      setSelectedStaff(null);
    } catch (deleteError) {
      showErrorNotification({
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete staff member.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDeleteModal = (member: StaffUser) => {
    setSelectedStaff(member);
    openDelete();
  };

  return (
    <Stack gap="lg">
      <Outlet />

      <Modal
        opened={deleteOpened}
        onClose={() => {
          closeDelete();
          setSelectedStaff(null);
        }}
        title="Delete staff"
        centered
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete{" "}
            <Text span fw={700}>
              {selectedStaff?.full_name}
            </Text>
            ?
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                closeDelete();
                setSelectedStaff(null);
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={
                deleteStaffMutation.isPending &&
                deletingId === selectedStaff?.id
              }
              onClick={() => {
                if (selectedStaff) {
                  void handleDelete(selectedStaff.id);
                }
              }}
            >
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{t("staffPage.title")}</Title>
          <Text c="dimmed">{t("staffPage.subtitle")}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          radius="md"
          onClick={() => {
            navigate("/staff/add");
          }}
        >
          {t("staffPage.createButton")}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }}>
        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            {t("staffPage.totalStaff")}
          </Text>
          <Title order={3} mt={8}>
            {filteredStaff.length}
          </Title>
        </Card>
        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            {t("staffPage.adminCount")}
          </Text>
          <Title order={3} mt={8}>
            {filteredStaff.filter((member) => member.role === "admin").length}
          </Title>
        </Card>
        <Card withBorder radius="xl" p="lg">
          <Text c="dimmed" size="sm">
            {t("staffPage.operatorCount")}
          </Text>
          <Title order={3} mt={8}>
            {
              filteredStaff.filter((member) => member.role === "operator")
                .length
            }
          </Title>
        </Card>
      </SimpleGrid>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack align="center" py="xl" gap="sm">
            <Alert color="red" variant="light" w="100%">
              {error.message || t("staffPage.loadError")}
            </Alert>
            <Button
              variant="light"
              onClick={() => {
                void queryClient.invalidateQueries({
                  queryKey: [
                    "staff-users",
                    useAuthStore.getState().company?.id,
                  ],
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
              <Text c="dimmed">{t("staffPage.loading")}</Text>
            </Stack>
          </Center>
        ) : !filteredStaff.length ? (
          <Center py="xl">
            <Stack align="center" gap="xs">
              <Title order={4}>{t("staffPage.emptyTitle")}</Title>
              <Text c="dimmed" ta="center">
                {t("staffPage.emptyDescription")}
              </Text>
              <Button
                variant="light"
                onClick={() => {
                  navigate("/staff/add");
                }}
              >
                {t("staffPage.createButton")}
              </Button>
            </Stack>
          </Center>
        ) : (
          <Table highlightOnHover verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("staffPage.employee")}</Table.Th>
                <Table.Th>{t("staffPage.phoneColumn")}</Table.Th>
                <Table.Th>{t("staffPage.role")}</Table.Th>
                <Table.Th>{t("staffPage.createdAt")}</Table.Th>
                <Table.Th>{t("staffPage.actions")}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredStaff.map((member) => (
                <Table.Tr key={member.id}>
                  <Table.Td>
                    <Text fw={600}>{member.full_name}</Text>
                  </Table.Td>
                  <Table.Td>{member.phone_number}</Table.Td>
                  <Table.Td>
                    {member.role === "super_admin"
                      ? t("staffPage.superAdminRole")
                      : member.role === "operator"
                        ? t("staffPage.operatorRole")
                        : t("staffPage.adminRole")}
                  </Table.Td>
                  <Table.Td>
                    {new Date(member.created_at).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        aria-label="Edit"
                        title="Edit"
                        onClick={() => {
                          navigate(`/staff/edit/${member.id}`, {
                            state: { staff: member },
                          });
                        }}
                      >
                        <IconPencil size={18} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        aria-label="Delete"
                        title="Delete"
                        disabled={deleteStaffMutation.isPending}
                        onClick={() => {
                          handleOpenDeleteModal(member);
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}
