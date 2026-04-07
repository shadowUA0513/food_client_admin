import {
  Alert,
  Box,
  Card,
  Group,
  Loader,
  Stack,
  Text,
} from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const YANDEX_MAPS_SCRIPT_ID = "yandex-maps-api-script";
const YANDEX_MAPS_API_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
const DEFAULT_CENTER: [number, number] = [41.3111, 69.2797];

type LocationValue = {
  address: string;
  latitude: number;
  longitude: number;
};

type MapAddressPickerProps = {
  address: string;
  latitude: number;
  longitude: number;
  onChange: (value: LocationValue) => void;
  error?: string;
};

declare global {
  interface YandexMapGeoObjects {
    add: (geoObject: unknown) => void;
    removeAll: () => void;
  }

  interface YandexMapEvents {
    add: (eventName: string, handler: (event: unknown) => void) => void;
  }

  interface YandexMapInstance {
    destroy: () => void;
    geoObjects: YandexMapGeoObjects;
    events: YandexMapEvents;
    setCenter?: (center: number[], zoom?: number) => void;
  }

  interface YandexPlacemarkInstance {
    events: {
      add: (eventName: string, handler: (event: unknown) => void) => void;
    };
  }

  interface YandexMapsApi {
    Map: new (
      element: HTMLElement,
      state: unknown,
      options?: unknown,
    ) => YandexMapInstance;
    Placemark: new (
      coords: number[],
      properties?: Record<string, unknown>,
      options?: Record<string, unknown>,
    ) => YandexPlacemarkInstance;
    ready: (callback: () => void) => void;
  }

  interface Window {
    ymaps?: YandexMapsApi;
  }
}

interface NominatimReverseResponse {
  display_name?: string;
}

function hasValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

function loadYandexMapsScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.ymaps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(
      YANDEX_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load map.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    const query = YANDEX_MAPS_API_KEY ? `&apikey=${YANDEX_MAPS_API_KEY}` : "";
    script.id = YANDEX_MAPS_SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU${query}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load map."));
    document.head.appendChild(script);
  });
}

async function reverseGeocode(latitude: number, longitude: number) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
  );

  if (!response.ok) {
    throw new Error("Failed to resolve address.");
  }

  const data = (await response.json()) as NominatimReverseResponse;
  return data.display_name?.trim() || "";
}

export function MapAddressPicker({
  address,
  latitude,
  longitude,
  onChange,
  error,
}: MapAddressPickerProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<YandexMapInstance | null>(null);
  const updatePlacemarkRef = useRef<
    ((latitude: number, longitude: number, label: string) => void) | null
  >(null);
  const onChangeRef = useRef(onChange);
  const initializedRef = useRef(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    let cancelled = false;

    void loadYandexMapsScript()
      .then(() => {
        if (cancelled || !mapRef.current || !window.ymaps) {
          return;
        }

        window.ymaps.ready(() => {
          if (cancelled || !mapRef.current || !window.ymaps) {
            return;
          }

          mapInstanceRef.current?.destroy();

          const initialCenter =
            hasValidCoordinates(latitude, longitude)
              ? [latitude, longitude]
              : DEFAULT_CENTER;

          const map = new window.ymaps.Map(
            mapRef.current,
            {
              center: initialCenter,
              zoom: 13,
              controls: ["zoomControl", "geolocationControl"],
            },
            {
              suppressMapOpenBlock: true,
            },
          );

          const updatePlacemark = (
            nextLatitude: number,
            nextLongitude: number,
            label: string,
          ) => {
            map.geoObjects.removeAll();
            const placemark = new window.ymaps!.Placemark(
              [nextLatitude, nextLongitude],
              {
                hintContent: label,
                balloonContent: label,
              },
              {
                preset: "islands#orangeDotIcon",
              },
            );

            map.geoObjects.add(placemark);
            map.setCenter?.([nextLatitude, nextLongitude], 15);
          };

          updatePlacemarkRef.current = updatePlacemark;

          if (address && hasValidCoordinates(latitude, longitude)) {
            updatePlacemark(latitude, longitude, address);
          }

          map.events.add("click", (event: unknown) => {
            const coords = (event as { get?: (name: string) => unknown })
              .get?.("coords") as number[] | undefined;

            if (!coords || coords.length < 2) {
              return;
            }

            const nextLatitude = coords[0];
            const nextLongitude = coords[1];
            setIsResolvingAddress(true);
            setMapError(null);

            void reverseGeocode(nextLatitude, nextLongitude)
              .then((resolvedAddress) => {
                if (!resolvedAddress) {
                  setMapError(t("partnersPage.addressNotFoundForPoint"));
                  return;
                }

                updatePlacemark(nextLatitude, nextLongitude, resolvedAddress);
                onChangeRef.current({
                  address: resolvedAddress,
                  latitude: nextLatitude,
                  longitude: nextLongitude,
                });
                setMapError(null);
              })
              .catch(() => {
                setMapError(t("partnersPage.addressResolveError"));
              })
              .finally(() => {
                setIsResolvingAddress(false);
              });
          });

          mapInstanceRef.current = map;
          setMapError(null);
          setIsLoadingMap(false);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setMapError(t("partnersPage.yandexMapLoadError"));
          setIsLoadingMap(false);
        }
      });

    return () => {
      cancelled = true;
      mapInstanceRef.current?.destroy();
      mapInstanceRef.current = null;
      updatePlacemarkRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (
      !updatePlacemarkRef.current ||
      !address ||
      !hasValidCoordinates(latitude, longitude)
    ) {
      return;
    }

    updatePlacemarkRef.current(latitude, longitude, address);
  }, [address, latitude, longitude]);

  return (
    <Stack gap="md">
      <Card withBorder radius="md" p="md">
        <Stack gap={4}>
          <Text fw={700}>{t("partnersPage.mapSelectTitle")}</Text>
          <Text size="sm" c="dimmed">
            {t("partnersPage.mapSelectDescription")}
          </Text>
        </Stack>
      </Card>

      <Box
        ref={mapRef}
        style={{
          minHeight: 320,
          width: "100%",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid var(--mantine-color-gray-3)",
          position: "relative",
        }}
      >
        {isLoadingMap ? (
          <Group
            justify="center"
            style={{
              inset: 0,
              position: "absolute",
              background: "rgba(255,255,255,0.82)",
              zIndex: 2,
            }}
          >
            <Loader size="sm" />
          </Group>
        ) : null}
      </Box>

      <Card withBorder radius="md" p="md">
        <Text size="sm" fw={700}>
          {t("partnersPage.selectedAddress")}
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          {isResolvingAddress
            ? t("partnersPage.resolvingAddress") : address || t("partnersPage.clickMapToChooseAddress")}
        </Text>
        {error ? (
          <Text size="xs" c="red" mt={8}>
            {error}
          </Text>
        ) : null}
        {mapError ? (
          <Alert color="red" variant="light" mt="sm">
            {mapError}
          </Alert>
        ) : null}
      </Card>
    </Stack>
  );
}



