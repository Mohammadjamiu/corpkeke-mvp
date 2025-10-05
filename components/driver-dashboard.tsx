"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, User, Phone, LogOut, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

// Brand colors
const BRAND_GREEN = "#38761D";
const BRAND_GOLD = "#FFD966";

interface Ride {
  id: string;
  pickup_location: { address: string; lat: number; lng: number };
  dropoff_location: { address: string; lat: number; lng: number };
  status: string;
  created_at: string;
  passenger?: { name: string; phone: string };
}

interface DriverDashboardProps {
  user: { name: string; vehicle_info: string };
  pendingRides: Ride[];
  acceptedRides: Ride[];
}

export default function DriverDashboard({
  user,
  pendingRides: initialPending,
  acceptedRides: initialAccepted,
}: DriverDashboardProps) {
  const [pendingRides, setPendingRides] = useState<Ride[]>(initialPending);
  const [acceptedRides, setAcceptedRides] = useState<Ride[]>(initialAccepted);
  const [acceptingRide, setAcceptingRide] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Subscribe to ride changes
  useEffect(() => {
    const channel = supabase
      .channel("driver-rides")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
          filter: "status=eq.pending",
        },
        async (payload) => {
          const { data } = await supabase
            .from("rides")
            .select(
              `
              *,
              passenger:passenger_id (
                name,
                phone
              )
            `
            )
            .eq("id", payload.new.id)
            .single();
          if (data) setPendingRides((prev) => [data, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides" },
        (payload) => {
          if (payload.new.status === "accepted") {
            setPendingRides((prev) =>
              prev.filter((r) => r.id !== payload.new.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleAcceptRide = async (rideId: string) => {
    setAcceptingRide(rideId);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("rides")
        .update({
          driver_id: currentUser.id,
          status: "accepted",
        })
        .eq("id", rideId)
        .eq("status", "pending");

      if (error) throw error;

      const ride = pendingRides.find((r) => r.id === rideId);
      if (ride) {
        setPendingRides((prev) => prev.filter((r) => r.id !== rideId));
        setAcceptedRides((prev) => [{ ...ride, status: "accepted" }, ...prev]);
      }
    } catch (err) {
      console.error("Failed to accept ride:", err);
    } finally {
      setAcceptingRide(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-svh bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto flex items-center justify-between p-4">
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{ color: BRAND_GREEN }}
            >
              CORP KÈKÉ
            </h1>
            <p className="text-sm text-gray-600">Driver: {user.name}</p>
            <p className="text-xs text-gray-500">{user.vehicle_info}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 text-red-600" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto p-4 md:p-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg bg-gray-100">
            <TabsTrigger value="pending" className="font-medium">
              Available Rides
              {pendingRides.length > 0 && (
                <Badge className="ml-2 bg-yellow-500 text-white">
                  {pendingRides.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted" className="font-medium">
              My Rides
              {acceptedRides.length > 0 && (
                <Badge className="ml-2 bg-green-600 text-white">
                  {acceptedRides.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Rides */}
          <TabsContent value="pending" className="mt-6">
            {pendingRides.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-12 w-12 text-gray-400" />}
                text="No pending ride requests at the moment."
              />
            ) : (
              <div className="grid gap-4">
                {pendingRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    onAccept={() => handleAcceptRide(ride.id)}
                    accepting={acceptingRide === ride.id}
                    brandGreen={BRAND_GREEN}
                    type="pending"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Accepted Rides */}
          <TabsContent value="accepted" className="mt-6">
            {acceptedRides.length === 0 ? (
              <EmptyState
                icon={<CheckCircle className="h-12 w-12 text-gray-400" />}
                text="No accepted rides yet."
              />
            ) : (
              <div className="grid gap-4">
                {acceptedRides.map((ride) => (
                  <RideCard
                    key={ride.id}
                    ride={ride}
                    brandGreen={BRAND_GREEN}
                    type="accepted"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Supporting Components ---------- */

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {icon}
        <p className="mt-4 text-gray-500">{text}</p>
      </CardContent>
    </Card>
  );
}

function RideCard({
  ride,
  onAccept,
  accepting,
  brandGreen,
  type,
}: {
  ride: Ride;
  onAccept?: () => void;
  accepting?: boolean;
  brandGreen: string;
  type: "pending" | "accepted";
}) {
  const isPending = type === "pending";

  return (
    <Card
      className={`${
        isPending
          ? "border-yellow-200 bg-yellow-50/50"
          : "border-green-200 bg-green-50/50"
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">
              {isPending ? "New Ride Request" : "Active Ride"}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {new Date(ride.created_at).toLocaleString()}
            </CardDescription>
          </div>
          <Badge
            className={`${
              isPending
                ? "bg-yellow-100 text-yellow-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {isPending ? "Pending" : "Accepted"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <LocationBlock
          pickup={ride.pickup_location.address}
          dropoff={ride.dropoff_location.address}
          brandGreen={brandGreen}
        />

        {ride.passenger && (
          <PassengerCard passenger={ride.passenger} isPending={isPending} />
        )}

        {isPending && onAccept && (
          <Button
            onClick={onAccept}
            disabled={accepting}
            className="w-full bg-green-700 hover:bg-green-800"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {accepting ? "Accepting..." : "Accept Ride"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LocationBlock({
  pickup,
  dropoff,
  brandGreen,
}: {
  pickup: string;
  dropoff: string;
  brandGreen: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <MapPin className="mt-1 h-4 w-4" style={{ color: brandGreen }} />
        <div>
          <p className="text-sm font-medium">Pickup</p>
          <p className="text-sm text-gray-600">{pickup}</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <MapPin className="mt-1 h-4 w-4 text-red-600" />
        <div>
          <p className="text-sm font-medium">Drop-off</p>
          <p className="text-sm text-gray-600">{dropoff}</p>
        </div>
      </div>
    </div>
  );
}

function PassengerCard({
  passenger,
  isPending,
}: {
  passenger: { name: string; phone?: string };
  isPending?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border ${
        isPending ? "bg-white p-3" : "bg-white p-4"
      }`}
    >
      <p className="mb-2 text-xs font-semibold text-gray-500">
        Passenger Details
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-green-700" />
          <span>{passenger.name}</span>
        </div>
        {passenger.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-700" />
            <span>{passenger.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
