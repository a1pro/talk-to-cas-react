import { useEffect, useRef, useState } from "react";
import {
  selectWebsiteChatVenue,
  sendWebsiteChatLocation,
  sendWebsiteChatMessage,
  startWebsiteChatSession,
} from "@/api/whatsapp";
import type { ChatSessionPayload, Venue } from "@/types";

const LAUNCH_DELAY_MS = 800;
const DEMO_POSTCODES = ["M4 2BS", "M4 3AQ", "M3 4EN", "M1 1AE", "M4 6DE"];

// Step hierarchy for back navigation
const STEP_BACK_MAP: Record<string, string> = {
  showing_results: "awaiting_weather_choice",
  awaiting_weather_choice: "awaiting_location",
  awaiting_dual_choice_mode: "showing_results",
  awaiting_email: "awaiting_dual_choice_mode",
  awaiting_consent: "awaiting_email",
};

function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "").trim();
}

function money(value?: string | number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "0";
  return amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
}

function offerSummary(venue: Venue) {
  if (venue.offer_type === "dual_choice" || venue.offer_type === "dual") {
    return `£${money(venue.offer_value)} flexible voucher • choose Ride or Food`;
  }
  if (venue.offer_type === "food") {
    return `£${money(venue.offer_value)} off food${venue.minimum_order ? ` • £${money(venue.minimum_order)}+ minimum order` : ""}`;
  }
  const tripWording =
    venue.ride_trip_type === "to_and_from"
      ? "2 Trips (to-and-from)"
      : venue.ride_trip_type === "to_venue"
        ? "1 Trip (to venue only)"
        : "";
  return `£${money(venue.offer_value)} off ride${tripWording ? ` • ${tripWording}` : ""}`;
}

function routeSummary(venue?: Venue | null) {
  if (!venue) return null;
  const parts = [venue.route?.eta_label, venue.route?.distance_label || venue.distance_label].filter(Boolean);
  return parts.length ? parts.join(" • ") : null;
}

function stepLabel(lastStep: string) {
  switch (lastStep) {
    case "awaiting_journey":
      return "Choose Going Out or Food";
    case "awaiting_location":
      return "Share location or postcode";
    case "awaiting_weather_choice":
      return "Choose a lane";
    case "showing_results":
      return "Choose a venue";
    case "awaiting_dual_choice_mode":
      return "Choose Ride or Food";
    case "awaiting_email":
      return "Email optional";
    case "awaiting_consent":
      return "Confirm voucher";
    case "voucher_issued":
      return "Voucher ready";
    case "voucher_issue_error":
      return "Voucher issue blocked";
    case "fraud_blocked":
      return "Voucher blocked";
    case "ended":
      return "Chat ended";
    default:
      return lastStep.replace(/_/g, " ");
  }
}

type WeatherInsight = {
  emoji: string;
  title: string;
  description: string;
  temperatureLabel?: string | null;
  precipitationLabel?: string | null;
  lookaheadLabel?: string | null;
  note?: string | null;
  impact: string;
  hourly: Array<Record<string, any>>;
};

function weatherKey(weather?: Record<string, any> | null) {
  const key = String(weather?.condition_key || weather?.condition || "").toLowerCase();
  if (key.includes("snow") || key.includes("ice")) return "snow_ice";
  if (key.includes("rain") || key.includes("drizzle")) return "rain";
  if (key.includes("cold")) return "cold";
  if (key.includes("clear")) return "clear";
  return key || "weather";
}

function weatherEmoji(key: string) {
  if (key === "rain") return "🌧️";
  if (key === "snow_ice") return "❄️";
  if (key === "cold") return "🥶";
  if (key === "clear") return "🌤️";
  return "🌦️";
}

function weatherTitle(key: string) {
  if (key === "rain") return "Rain expected nearby";
  if (key === "snow_ice") return "Snow or ice risk nearby";
  if (key === "cold") return "Cold weather nearby";
  if (key === "clear") return "Weather looks clear";
  return "Weather checked nearby";
}

function formatNumberLabel(value: unknown, suffix: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1)}${suffix}`;
}

function weatherImpact(key: string, journeyType?: string | null) {
  const food = journeyType === "food";
  if (key === "rain" || key === "snow_ice") {
    return food
      ? "CAS can push delivery-friendly food offers higher when the weather is poor."
      : "CAS can boost indoor venues and reduce long-walk options when the weather is poor.";
  }
  if (key === "cold") {
    return food
      ? "CAS can favour warmer, delivery-friendly food choices tonight."
      : "CAS can favour indoor venues and easier ride options tonight.";
  }
  return "CAS uses this weather check as one ranking signal with distance, offer value, and venue status.";
}

function buildWeatherInsight(
  session: ChatSessionPayload | null,
  selectedVenue: Venue | null,
  venueResults: Venue[],
): WeatherInsight | null {
  const rawWeather = session?.weather && typeof session.weather === "object" ? session.weather : null;
  const weather = rawWeather as Record<string, any> | null;
  const note =
    session?.weather_note ||
    selectedVenue?.weather_note ||
    venueResults.find((venue) => Boolean(venue.weather_note))?.weather_note ||
    null;

  if (!weather && !note) return null;

  const key = weatherKey(weather);
  const description =
    String(weather?.description || "").trim() ||
    (note ? String(note) : "CAS has checked the local weather for this recommendation.");
  const temperatureLabel = formatNumberLabel(weather?.temperature_c, "°C");
  const precipitationLabel = formatNumberLabel(weather?.precipitation_probability, "% rain risk");
  const lookaheadHours = Number(weather?.lookahead_hours);
  const lookaheadLabel = Number.isFinite(lookaheadHours) && lookaheadHours > 0 ? `Next ${lookaheadHours}h` : null;

  return {
    emoji: weatherEmoji(key),
    title: weatherTitle(key),
    description,
    temperatureLabel,
    precipitationLabel,
    lookaheadLabel,
    note: note ? String(note) : null,
    impact: weatherImpact(key, session?.journey_type),
    hourly: Array.isArray(weather?.hourly) ? weather.hourly.slice(0, 4) : [],
  };
}

export function WhatsAppLaunchWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [draft, setDraft] = useState("");
  const [session, setSession] = useState<ChatSessionPayload | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [weatherPanelOpen, setWeatherPanelOpen] = useState(false);
  const [stepHistory, setStepHistory] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const hasAutoScrolledRef = useRef(false);
  const venueResultsCacheRef = useRef<Venue[]>([]);

  const lastStep = session?.last_step ?? "phone_capture";
  const liveArea = session?.live_area;
  const resolvedLocation = session?.resolved_location;
  const rawVenueResults = (session?.venue_results || session?.venues || []) as Venue[];
  const venueResults = lastStep === "showing_results" ? rawVenueResults : [];
  const voucher = session?.voucher;
  const voucherLink = voucher?.provider_link_url || voucher?.voucher_link || voucher?.voucher_link_url || null;
  const selectedVenue = session?.selected_venue || null;
  const isEnded = session?.status === "ended" || lastStep === "ended";
  const isIssueBlocked = lastStep === "fraud_blocked" || lastStep === "voucher_issue_error";
  const canChangeNumber = Boolean(session);
  const canChangeLocation = Boolean(session) && !isEnded && !voucher && !["awaiting_journey", "awaiting_location"].includes(lastStep);
  const canChangeJourney = Boolean(session) && !isEnded && !voucher && !["awaiting_journey", "phone_capture"].includes(lastStep);
  const journeyPreviews = lastStep === "awaiting_weather_choice"
    ? (session?.journey_previews || []).filter((item: any) => ["nightlife", "food"].includes(item?.key))
    : [];
  const showJourneyButtons = lastStep === "awaiting_journey";
  const showLocationCard = lastStep === "awaiting_location";
  const showJourneyPreviews = lastStep === "awaiting_weather_choice" && journeyPreviews.length > 0;
  const showVenueResults = lastStep === "showing_results" && venueResults.length > 0 && !voucher && !isEnded;
  const showSelectedVenue =
    Boolean(selectedVenue) &&
    ["awaiting_dual_choice_mode", "awaiting_email", "awaiting_consent"].includes(lastStep) &&
    !voucher &&
    !isEnded;
  const showEmailStage = lastStep === "awaiting_email" && !voucher && !isEnded;
  const showConsentStage = lastStep === "awaiting_consent" && !voucher && !isEnded;
  const showDualModeChoice =
    lastStep === "awaiting_dual_choice_mode" &&
    !isEnded &&
    (selectedVenue?.offer_type === "dual_choice" || selectedVenue?.offer_type === "dual");
  
  const showEndChat = Boolean(session) && (voucher || isEnded || isIssueBlocked);
  const showBackButton = showVenueResults || showSelectedVenue || showDualModeChoice || showEmailStage || showConsentStage;
  const weatherInsight = buildWeatherInsight(session, selectedVenue, venueResultsCacheRef.current.length ? venueResultsCacheRef.current : rawVenueResults);

  // Track step history for proper back navigation
  useEffect(() => {
    if (session?.last_step && lastStep !== "phone_capture") {
      setStepHistory(prev => {
        // Only add to history if it's a new step we haven't seen
        if (prev.length === 0 || prev[prev.length - 1] !== lastStep) {
          return [...prev, lastStep];
        }
        return prev;
      });
    }
  }, [session?.last_step]);

  async function handleBackCommand() {
    const sessionId = session?.id;
    if (!sessionId || isBusy || stepHistory.length <= 1) return;

    setIsBusy(true);
    setError(null);

    try {
      // Get the previous step from history
      const newHistory = [...stepHistory];
      newHistory.pop(); // Remove current step
      const previousStep = newHistory[newHistory.length - 1];
      
      // Update step history
      setStepHistory(newHistory);

      // Determine the appropriate back command based on target step
      let backCommand = "BACK";
      if (previousStep === "awaiting_location") {
        backCommand = "CHANGE POSTCODE";
      } else if (previousStep === "awaiting_journey") {
        backCommand = "CHANGE CHOICE";
      }

      const nextSession = await sendWebsiteChatMessage(sessionId, backCommand);
      
      // If we're going back to venue results, restore cached venues
      if (previousStep === "showing_results" && venueResultsCacheRef.current.length > 0) {
        setSession({
          ...nextSession,
          last_step: "showing_results",
          venue_results: venueResultsCacheRef.current,
          venues: venueResultsCacheRef.current,
          selected_venue: null,
          voucher: null,
        });
        setToast("Choose another venue.");
      } else {
        setSession({
          ...nextSession,
          last_step: previousStep,
          selected_venue: previousStep === "showing_results" ? null : selectedVenue,
          voucher: null,
        });
      }
      
      setDraft("");
    } catch (err: any) {
      console.error("Failed to go back:", err);
      // Restore step history on error
      setStepHistory(prev => [...prev, lastStep]);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Could not go back. Please try again.";
      setError(errorMessage);
    } finally {
      setIsBusy(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(true), LAUNCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (rawVenueResults.length > 0) {
      venueResultsCacheRef.current = rawVenueResults;
    }
  }, [rawVenueResults]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !open) return;
    const timer = window.setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: hasAutoScrolledRef.current ? "smooth" : "auto",
      });
      hasAutoScrolledRef.current = true;
    }, 40);
    return () => window.clearTimeout(timer);
  }, [open, lastStep, selectedVenue?.id, voucher?.id, venueResults.length, toast, error]);

  async function beginChat() {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 10) {
      setError("Please enter your WhatsApp number with country code first.");
      return;
    }
    setIsBusy(true);
    setError(null); 
    try {
      const nextSession = await startWebsiteChatSession(normalizedPhone, "Website visitor", true);
      setSession(nextSession);
      setStepHistory([nextSession.last_step || ""]);
      setToast("✓ Number verified. Choose Going Out or Ordering Food to begin.");
      setDraft("");
    } catch (err) {
      console.error(err);
      setError("Could not start the chat right now.");
    } finally {
      setIsBusy(false);
    }
  }

  async function changeNumber() {
    const sessionId = session?.id;
    setIsBusy(true);
    try {
      if (sessionId && !isEnded) {
        await sendWebsiteChatMessage(sessionId, "CHANGE NUMBER");
      }
    } catch (err) {
      console.warn("Could not close previous chat before changing number", err);
    } finally {
      setSession(null);
      setPhone("");
      setDraft("");
      setError(null);
      setStepHistory([]);
      setToast("Enter the correct WhatsApp number to start again.");
      setIsBusy(false);
    }
  }

  async function pushTextMessage(message: string) {
    const sessionId = session?.id;
    const trimmed = message.trim();
    if (!sessionId) {
      console.error("No session ID available");
      setError("Chat session not found. Please restart the chat.");
      return;
    }
    if (!trimmed) {
      console.error("Empty message attempted");
      return;
    }
    setIsBusy(true);
    setError(null);
    
    try {
      const nextSession = await sendWebsiteChatMessage(sessionId, trimmed);
      setSession(nextSession);
      setDraft("");
    } catch (err: any) {
      console.error("Failed to send message:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Message could not be sent. Please try again.";
      setError(errorMessage);
    } finally {
      setIsBusy(false);
    }
  }

  async function pushLocationFromBrowser() {
    const sessionId = session?.id;
    if (!sessionId || !navigator.geolocation) {
      setError("Location is not available on this device. Please type your postcode.");
      return;
    }
    setIsBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const nextSession = await sendWebsiteChatLocation(sessionId, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setSession(nextSession);
          setToast("Location shared successfully.");
        } catch (err) {
          console.error(err);
          setError("Location could not be shared. Please type your postcode.");
        } finally {
          setIsBusy(false);
        }
      },
      () => {
        setIsBusy(false);
        setError("Location permission was denied. Please type your postcode instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function pushVenueSelection(venueId: number) {
    const sessionId = session?.id;
    if (!sessionId) return;
    setIsBusy(true);
    setError(null);
    try {
      const nextSession = await selectWebsiteChatVenue(sessionId, venueId);
      setSession(nextSession);
    } catch (err) {
      console.error(err);
      setError("That venue could not be selected. Please try again.");
    } finally {
      setIsBusy(false);
    }
  }

  const inputPlaceholder = (() => {
    if (!session) return "Enter your WhatsApp number";
    if (lastStep === "awaiting_location") return "Type your postcode";
    if (lastStep === "awaiting_journey") return "Type 1 or 2";
    if (lastStep === "awaiting_weather_choice") return "Type 1 or 2";
    if (lastStep === "awaiting_dual_choice_mode") return "Type RIDE or FOOD";
    if (lastStep === "awaiting_email") return "Enter your email or type SKIP";
    if (lastStep === "awaiting_consent") return "Type YES to confirm";
    if (showVenueResults) return "Reply with a venue number";
    if (isIssueBlocked) return "Type BACK, CHANGE POSTCODE, START, or END";
    if (isEnded) return "Type START to begin again";
    return "Type your answer";
  })();

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {open ? (
        <div className="relative w-[420px] max-w-[calc(100vw-32px)] bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 font-sans border border-gray-100">
          {/* Header */}
          <div className="px-5 py-4 flex justify-between items-center border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg shadow-md">
                💬
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-blue-600 mb-0.5">
                  CAS Assistant
                </p>
                <p className="text-sm font-medium text-gray-700">
                  Chat with CAS
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          {weatherPanelOpen && weatherInsight && (
            <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{weatherInsight.emoji}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">CAS Weather</p>
                    <h3 className="text-base font-bold text-gray-800">{weatherInsight.title}</h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWeatherPanelOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50/40 to-white">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{weatherInsight.description}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-white p-3 border border-blue-100">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Temp</p>
                      <p className="text-sm font-bold text-gray-800">{weatherInsight.temperatureLabel || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 border border-blue-100">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Rain</p>
                      <p className="text-sm font-bold text-gray-800">{weatherInsight.precipitationLabel || "—"}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-3 border border-blue-100">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Window</p>
                      <p className="text-sm font-bold text-gray-800">{weatherInsight.lookaheadLabel || "Now"}</p>
                    </div>
                  </div>
                </div>

                {weatherInsight.note && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">CAS recommendation note</p>
                    <p className="text-sm text-amber-900 leading-relaxed">{weatherInsight.note}</p>
                  </div>
                )}

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">How it affects ranking</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{weatherInsight.impact}</p>
                </div>

                {weatherInsight.hourly.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Next hours</p>
                    <div className="space-y-2">
                      {weatherInsight.hourly.map((hour, index) => (
                        <div key={`${hour.timestamp || index}`} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
                          <span className="text-gray-500">Hour {index + 1}</span>
                          <span className="font-medium text-gray-800">
                            {formatNumberLabel(hour.temperature_c, "°C") || "—"}
                          </span>
                          <span className="text-gray-500">
                            {formatNumberLabel(hour.precipitation_probability, "%") || "0%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setWeatherPanelOpen(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-md"
                >
                  Back to chat
                </button>
              </div>
            </div>
          )}

          {!session ? (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg">
                  👋
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Welcome to CAS</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Enter your WhatsApp number to start discovering the best offers near you.
                </p>
              </div>
              
              <label className="block mb-2 font-medium text-sm text-gray-600">
                WhatsApp number
              </label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. 447782555123"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all mb-2"
              />
              <p className="text-xs text-gray-400 mb-6">
                Include country code, for example 44 for the UK.
              </p>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              <button
                type="button"
                onClick={beginChat}
                disabled={isBusy}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                {isBusy ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Starting chat...
                  </>
                ) : (
                  "Start chat →"
                )}
              </button>
            </div>
          ) : (
            <>
              {/* Status bar with change options */}
              <div className="px-4 py-2 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/50 text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                  📱 {session.user?.phone || normalizePhone(phone)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full text-blue-700 border border-blue-100">
                  {stepLabel(lastStep)}
                </span>
                {resolvedLocation?.postcode && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                    📍 {resolvedLocation.postcode}
                  </span>
                )}
                {canChangeJourney && (
                  <button
                    onClick={() => pushTextMessage("CHANGE CHOICE")}
                    disabled={isBusy}
                    className="ml-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white rounded-full border border-gray-200 transition-colors"
                  >
                    Change choice
                  </button>
                )}
                {canChangeLocation && (
                  <button
                    onClick={() => pushTextMessage("CHANGE POSTCODE")}
                    disabled={isBusy}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white rounded-full border border-gray-200 transition-colors"
                  >
                    Change postcode
                  </button>
                )}
                {canChangeNumber && !isEnded && (
                  <button
                    onClick={changeNumber}
                    disabled={isBusy}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 bg-white rounded-full border border-gray-200 transition-colors"
                  >
                    Change number
                  </button>
                )}
              </div>

              {/* Chat area */}
              <div
                ref={scrollRef}
                className="max-h-[460px] overflow-y-auto p-5 flex flex-col gap-4 bg-gradient-to-b from-gray-50/30 to-white"
              >
                {/* Unified Back button - only show when there's a history to go back to */}
                {showBackButton && stepHistory.length > 1 && (
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={handleBackCommand}
                      disabled={isBusy}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-full border border-gray-200 shadow-sm transition-colors"
                    >
                      ← Back
                    </button>
                  </div>
                )}

                {showJourneyButtons && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                          👋
                        </div>
                        <div>
                          <strong className="text-gray-800 text-base">Hi, I'm CAS</strong>
                          <p className="text-sm text-gray-600 mt-1">I'll help find the best offers near you!</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => pushTextMessage("1")}
                        disabled={isBusy}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                      >
                        🚗 Going Out
                      </button>
                      <button
                        onClick={() => pushTextMessage("2")}
                        disabled={isBusy}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                      >
                        🍔 Ordering Food
                      </button>
                    </div>
                  </div>
                )}

                {showLocationCard && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">📍</span>
                        <div>
                          <strong className="text-gray-800">Set your area</strong>
                          <p className="text-sm text-gray-500 mt-1">
                            Share your live location or type a postcode.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {DEMO_POSTCODES.map((pc) => (
                        <button
                          key={pc}
                          onClick={() => pushTextMessage(pc)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors"
                        >
                          {pc}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={pushLocationFromBrowser}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      📍 Share my location
                    </button>
                  </div>
                )}

                {showJourneyPreviews && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                    <strong className="text-gray-800 block mb-1">Choose your lane</strong>
                    <p className="text-sm text-gray-500 mb-4">Your area is saved. Pick the type of offer you want to see.</p>
                    <div className="flex gap-3">
                      {journeyPreviews.map((preview: any) => (
                        <button
                          key={preview.key}
                          onClick={() => pushTextMessage(preview.key === "food" ? "2" : "1")}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-all shadow-md text-sm"
                        >
                          {preview.key === "food" ? "🍔 Ordering Food" : "🚗 Going Out"}
                          <span className="block text-xs opacity-90 mt-1">
                            {preview.count || 0} live option{preview.count === 1 ? "" : "s"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {liveArea && !isEnded && !showVenueResults && !showSelectedVenue && !voucher && lastStep !== "awaiting_location" && (
                  <div className={`rounded-2xl p-4 border-l-4 ${
                    liveArea.is_live 
                      ? "bg-green-50 border-green-500" 
                      : "bg-blue-50 border-blue-500"
                  }`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{liveArea.is_live ? "✅" : "⚠️"}</span>
                      <div>
                        <strong className="text-sm text-gray-800">Service status</strong>
                        <p className="text-sm text-gray-600 mt-1">
                          {liveArea.is_live
                            ? `Live in ${liveArea.label || liveArea.postcode_prefix || "this area"}`
                            : "Coming soon to your area"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {showVenueResults && (
                  <>
                    <div className="mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎉</span>
                          <strong className="text-lg text-gray-800">Best live offers near you</strong>
                        </div>
                        <p className="text-xs text-gray-500">
                          Choose a venue card or reply with the venue number.
                        </p>
                      </div>
                    </div>
                    
                    {venueResults.slice(0, 5).map((venue, idx) => (
                      <div
                        key={venue.id}
                        className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <strong className="text-gray-800 text-base">
                              {idx + 1}. {venue.name}
                            </strong>
                          </div>
                          <span className="inline-flex px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                            {venue.offer_label || venue.offer_type_label || "Offer"}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{offerSummary(venue)}</p>
                        {routeSummary(venue) && (
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <span>📍</span> {routeSummary(venue)}
                          </p>
                        )}
                        {venue.weather_note && (
                          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-2">
                            🌦️ {venue.weather_note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mb-3">
                          {[venue.category || "Venue", venue.postcode].filter(Boolean).join(" • ")}
                        </p>
                        
                        <button
                          onClick={() => pushVenueSelection(venue.id)}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm text-sm"
                        >
                          Choose venue {idx + 1}
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {resolvedLocation && !isEnded && !showVenueResults && !showSelectedVenue && !voucher && lastStep !== "awaiting_location" && (
                  <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                    <div className="flex items-center gap-2">
                      <span>✅</span>
                      <div>
                        <strong className="text-sm text-gray-800">Location set</strong>
                        <p className="text-sm text-gray-600">
                          {resolvedLocation.postcode || resolvedLocation.label || "Location matched"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {showSelectedVenue && selectedVenue && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span>✅</span>
                        <strong className="text-gray-800">Venue selected</strong>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-800 text-lg mb-1">{selectedVenue.name}</div>
                    <p className="text-sm text-gray-600 mb-4">{offerSummary(selectedVenue)}</p>
                    {weatherInsight?.note && (
                      <button
                        type="button"
                        onClick={() => setWeatherPanelOpen(true)}
                        className="w-full rounded-2xl border border-blue-100 bg-white/80 px-4 py-3 text-left hover:bg-white transition-colors"
                      >
                        <span className="block text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                          {weatherInsight.emoji} Weather layer
                        </span>
                        <span className="block text-sm text-gray-700">{weatherInsight.note}</span>
                      </button>
                    )}
                  </div>
                )}

                {showDualModeChoice && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
                    <strong className="text-gray-800 block mb-4">How do you want to use this flexible voucher?</strong>
                    <div className="flex gap-3">
                      <button
                        onClick={() => pushTextMessage("RIDE")}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-all shadow-md text-sm"
                      >
                        🚗 Use for ride
                      </button>
                      <button
                        onClick={() => pushTextMessage("FOOD")}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-3 px-4 rounded-2xl transition-all shadow-md text-sm"
                      >
                        🍔 Use for food
                      </button>
                    </div>
                  </div>
                )}

                {showEmailStage && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
                    <div className="text-3xl mb-3">📧</div>
                    <strong className="text-gray-800 block mb-1">Add your email</strong>
                    <p className="text-sm text-gray-500 mb-4">
                      Enter your email for updates, skip to continue, or go back if the venue is wrong.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => pushTextMessage("SKIP")}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-2xl transition-all shadow-md text-sm"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                )}

                {showConsentStage && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm text-center">
                    <div className="text-3xl mb-3">✅</div>
                    <strong className="text-gray-800 block mb-1">Confirm your voucher</strong>
                    <p className="text-sm text-gray-500 mb-4">
                      Type YES below or use the button to claim your voucher.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => pushTextMessage("YES")}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-2xl transition-all shadow-md text-sm"
                      >
                        ✓ Confirm voucher
                      </button>
                    </div>
                  </div>
                )}

                {isIssueBlocked && !voucher && (
                  <div className="bg-red-50 rounded-2xl p-5 border border-red-200 text-center">
                    <div className="text-3xl mb-3">⚠️</div>
                    <strong className="text-red-800 block mb-1">Voucher not sent yet</strong>
                    <p className="text-sm text-red-700 mb-4 leading-relaxed">
                      {session?.latest_assistant_message?.body || "We could not issue this voucher right now."}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => pushTextMessage("START")}
                        disabled={isBusy}
                        className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl border border-gray-200 transition-colors text-sm"
                      >
                        Start again
                      </button>
                    </div>
                    <p className="text-xs text-red-600 mt-3">
                      You can start again, or contact support if this looks wrong.
                    </p>
                  </div>
                )}

                {voucher && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-200 text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <strong className="text-gray-800 text-lg block mb-2">Your voucher is ready!</strong>
                    <div className="text-2xl font-bold tracking-wider font-mono text-blue-600 bg-white rounded-xl py-3 px-6 inline-block shadow-sm border border-blue-200">
                      {voucher.code}
                    </div>
                    <div className="text-sm text-gray-600 mt-3">
                      {voucher.journey_type === "food"
                        ? `£${money(voucher.voucher_value)} off food${voucher.minimum_order ? ` (min. £${money(voucher.minimum_order)})` : ""}`
                        : `£${money(voucher.voucher_value)} ride voucher`}
                    </div>
                    
                    {voucherLink && (
                      <div className="mt-5 space-y-3">
                        <a
                          href={voucherLink}
                          target="_blank"
                          rel="noreferrer"
                          className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl text-center"
                        >
                          Open Uber / Uber Eats voucher
                        </a>
                        <p className="text-xs text-gray-500 break-all bg-white rounded-lg p-2">
                          {voucherLink}
                        </p>
                        <p className="text-xs text-gray-500">
                          This link has also been sent to your WhatsApp number.
                        </p>
                      </div>
                    )}
                    
                    <p className="text-sm text-gray-600 mt-5 font-medium">
                      Thank you for using CAS. Enjoy your offer! 🎊
                    </p>
                  </div>
                )}

                {isEnded && (
                  <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-200">
                    <div className="text-4xl mb-3">👋</div>
                    <strong className="text-gray-800 block mb-1">Chat ended</strong>
                    <p className="text-sm text-gray-500 mb-5">
                      Thanks for chatting with CAS. You can start again any time.
                    </p>
                    <button
                      onClick={() => pushTextMessage("START")}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-2xl transition-all shadow-md text-sm"
                    >
                      Start again
                    </button>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-700 rounded-xl p-3 text-sm flex items-start gap-2 animate-fadeIn">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}
                
                {toast && (
                  <div className="bg-green-50 text-green-700 rounded-xl p-3 text-sm flex items-start gap-2 animate-fadeIn">
                    <span>✓</span>
                    <span>{toast}</span>
                  </div>
                )}
              </div>

              {weatherInsight && !isEnded && (
                <div className="px-4 py-2 border-t border-gray-100 bg-white">
                  <button
                    type="button"
                    onClick={() => setWeatherPanelOpen(true)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-left hover:bg-blue-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{weatherInsight.emoji}</span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-800 truncate">{weatherInsight.title}</span>
                        <span className="block text-xs text-gray-500 truncate">
                          {[weatherInsight.temperatureLabel, weatherInsight.precipitationLabel, weatherInsight.lookaheadLabel].filter(Boolean).join(" • ") || "Tap to view local weather"}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-blue-600">View</span>
                  </button>
                </div>
              )}

              {/* Input composer with optional End Chat button */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  pushTextMessage(draft);
                }}
                className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 items-center"
              >
                {showEndChat && (
                  <button
                    type="button"
                    onClick={() => pushTextMessage("END")}
                    disabled={isBusy}
                    className="px-3 py-2 text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    ✕ End
                  </button>
                )}
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={inputPlaceholder}
                  disabled={isBusy}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-gray-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  type="submit"
                  disabled={isBusy || !draft.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-2xl transition-all shadow-sm flex items-center gap-1"
                >
                  <span>Send</span>
                  <span>→</span>
                </button>
              </form>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3.5 px-6 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 text-base animate-bounce hover:animate-none"
        >
          <span className="text-xl">💬</span>
          <span>Chat with CAS</span>
        </button>
      )}
    </div>
  );
}