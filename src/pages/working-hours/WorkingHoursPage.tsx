import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Center,
  Group,
  Loader,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconRefresh, IconTrash } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useWorkingHours,
  useUpdateWorkingHours,
} from "../../service/workingHours";
import { useAuthStore } from "../../store/auth";
import type { WorkingHour } from "../../types/workingHours";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../utils/notifications";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DEFAULT_DAY_START = "08:00";
const DEFAULT_DAY_END = "18:00";
const DEFAULT_WEEKEND_START = "09:00";
const DEFAULT_WEEKEND_END = "14:00";

type FormErrors = Record<number, { start_time?: string; end_time?: string }>;

function getDayLabel(day: number, t: ReturnType<typeof useTranslation>["t"]) {
  return t(`workingHours.days.${day}`);
}

function sortWorkingHours(hours: WorkingHour[]) {
  return [...hours].sort(
    (left, right) =>
      DAY_ORDER.indexOf(left.day_of_week) -
      DAY_ORDER.indexOf(right.day_of_week),
  );
}

function normalizeWorkingHours(hours: WorkingHour[]) {
  return sortWorkingHours(hours).map((hour) => ({
    day_of_week: hour.day_of_week,
    start_time:
      hour.start_time ||
      (hour.day_of_week === 6 || hour.day_of_week === 0
        ? DEFAULT_WEEKEND_START
        : DEFAULT_DAY_START),
    end_time:
      hour.end_time ||
      (hour.day_of_week === 6 || hour.day_of_week === 0
        ? DEFAULT_WEEKEND_END
        : DEFAULT_DAY_END),
    is_active: Boolean(hour.is_active),
  }));
}

function createDefaultWorkingHour(day: number): WorkingHour {
  const isWeekend = day === 6 || day === 0;

  return {
    day_of_week: day,
    start_time: isWeekend ? DEFAULT_WEEKEND_START : DEFAULT_DAY_START,
    end_time: isWeekend ? DEFAULT_WEEKEND_END : DEFAULT_DAY_END,
    is_active: true,
  };
}

export default function WorkingHoursPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const companyId = useAuthStore((state) => state.company?.id);
  const { data, isLoading, error, isFetching } = useWorkingHours(companyId);
  const updateWorkingHoursMutation = useUpdateWorkingHours();
  const [rows, setRows] = useState<WorkingHour[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (data) {
      setRows(normalizeWorkingHours(data));
      setErrors({});
    }
  }, [data]);

  const usedDays = useMemo(
    () => new Set(rows.map((row) => row.day_of_week)),
    [rows],
  );
  const nextDay = DAY_ORDER.find((day) => !usedDays.has(day));
  const canAddDay = nextDay !== undefined;

  const updateRow = (
    day: number,
    updater: (current: WorkingHour) => WorkingHour,
  ) => {
    setRows((current) =>
      sortWorkingHours(
        current.map((row) => (row.day_of_week === day ? updater(row) : row)),
      ),
    );
    setErrors((current) => ({
      ...current,
      [day]: {
        start_time: undefined,
        end_time: undefined,
      },
    }));
  };

  const handleAddDay = () => {
    if (nextDay === undefined) {
      return;
    }

    setRows((current) =>
      sortWorkingHours([...current, createDefaultWorkingHour(nextDay)]),
    );
  };

  const handleRemoveDay = (day: number) => {
    setRows((current) => current.filter((row) => row.day_of_week !== day));
    setErrors((current) => {
      const next = { ...current };
      delete next[day];
      return next;
    });
  };

  const validate = () => {
    const nextErrors: FormErrors = {};

    rows.forEach((row) => {
      if (!row.is_active) {
        return;
      }

      if (!row.start_time) {
        nextErrors[row.day_of_week] = {
          ...nextErrors[row.day_of_week],
          start_time: t("workingHours.validation.startRequired"),
        };
      }

      if (!row.end_time) {
        nextErrors[row.day_of_week] = {
          ...nextErrors[row.day_of_week],
          end_time: t("workingHours.validation.endRequired"),
        };
      }

      if (row.start_time && row.end_time && row.start_time >= row.end_time) {
        nextErrors[row.day_of_week] = {
          start_time: t("workingHours.validation.invalidRange"),
          end_time: t("workingHours.validation.invalidRange"),
        };
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!companyId) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      await updateWorkingHoursMutation.mutateAsync({
        companyId,
        payload: {
          working_hours: sortWorkingHours(rows),
        },
      });

      showSuccessNotification({
        message: t("workingHours.saveSuccess"),
      });
    } catch (saveError) {
      showErrorNotification({
        message:
          saveError instanceof Error
            ? saveError.message
            : t("workingHours.saveError"),
      });
    }
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={3}>{t("workingHours.title")}</Title>
          <Text c="dimmed">{t("workingHours.subtitle")}</Text>
        </div>
        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            loading={isFetching}
            onClick={() => {
              void queryClient.invalidateQueries({
                queryKey: ["working-hours", companyId],
              });
            }}
          >
            {t("commonActions.refresh")}
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAddDay}
            disabled={!canAddDay}
          >
            {canAddDay
              ? t("workingHours.addNextDay", {
                  day: getDayLabel(nextDay, t),
                })
              : t("workingHours.allDaysAdded")}
          </Button>
        </Group>
      </Group>

      <Card withBorder radius="xl" p="lg">
        {error ? (
          <Stack gap="md">
            <Alert color="red" variant="light">
              {error.message || t("workingHours.loadError")}
            </Alert>
            <Group justify="flex-end">
              <Button
                variant="light"
                onClick={() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["working-hours", companyId],
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
              <Text c="dimmed">{t("workingHours.loading")}</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="lg">
            <Alert color="blue" variant="light">
              {t("workingHours.helper")}
            </Alert>

            {!rows.length ? (
              <Center py="xl">
                <Text c="dimmed">{t("workingHours.empty")}</Text>
              </Center>
            ) : (
              <Stack gap="sm">
                {rows.map((row) => (
                  <Card key={row.day_of_week} withBorder radius="lg" p="md">
                    <Stack gap="sm">
                      <Group justify="space-between" align="center">
                        <Text fw={700}>{getDayLabel(row.day_of_week, t)}</Text>
                        <ActionIcon
                          variant="light"
                          color="red"
                          aria-label={t("workingHours.removeDay")}
                          onClick={() => {
                            handleRemoveDay(row.day_of_week);
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>

                      <Group grow align="flex-end">
                        <Switch
                          checked={row.is_active}
                          label={t("workingHours.activeLabel")}
                          onChange={(event) => {
                            const isChecked = event.currentTarget.checked;

                            updateRow(row.day_of_week, (current) => ({
                              ...current,
                              is_active: isChecked,
                            }));
                          }}
                        />
                        <TextInput
                          type="time"
                          label={t("workingHours.startTime")}
                          value={row.start_time}
                          onChange={(event) => {
                            const value = event.currentTarget.value;

                            updateRow(row.day_of_week, (current) => ({
                              ...current,
                              start_time: value,
                            }));
                          }}
                          error={errors[row.day_of_week]?.start_time}
                          disabled={!row.is_active}
                        />
                        <TextInput
                          type="time"
                          label={t("workingHours.endTime")}
                          value={row.end_time}
                          onChange={(event) => {
                            const value = event.currentTarget.value;

                            updateRow(row.day_of_week, (current) => ({
                              ...current,
                              end_time: value,
                            }));
                          }}
                          error={errors[row.day_of_week]?.end_time}
                          disabled={!row.is_active}
                        />
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}

            <Group justify="flex-end">
              <Button
                onClick={() => {
                  void handleSave();
                }}
                loading={updateWorkingHoursMutation.isPending}
                disabled={!rows.length}
              >
                {t("workingHours.save")}
              </Button>
            </Group>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
