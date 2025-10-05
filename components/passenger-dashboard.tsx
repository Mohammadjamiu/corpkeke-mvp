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
import { MapPin, Clock, User, Phone, Car, LogOut, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import RideRequestForm from "./ride-request-form";

// ✅ Brand colors
const BRAND_GREEN = "#38761D";
const BRAND_GOLD = "#FFD966";

interface Ride {
  id: string;
  pickup_location: { address: string; lat: number; lng: number };
  dropoff_location: { address: string; lat: number; lng: number };
  status: string;
  created_at: string;
  driver?: {
    name: string;
    phone: string;
    vehicle_info: string;
  };
}

interface PassengerDashboardProps {
  user: { name: string };
  rides: Ride[];
}

export default function PassengerDashboard({
  user,
  rides: initialRides,
}: PassengerDashboardProps) {
  const [rides, setRides] = useState<Ride[]>(initialRides);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // 🔄 Realtime listener for ride updates
  useEffect(() => {
    const channel = supabase
      .channel("passenger-rides")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        async (payload) => {
          if (["INSERT", "UPDATE"].includes(payload.eventType)) {
            const { data } = await supabase
              .from("rides")
              .select(
                `
                *,
                driver:driver_id (
                  name,
                  phone,
                  vehicle_info
                )
              `
              )
              .eq("id", (payload?.new as { id: string })?.id)
              .single();

            if (data) {
              setRides((prev) => {
                const existing = prev.find((r) => r.id === data.id);
                if (existing) {
                  if (JSON.stringify(existing) === JSON.stringify(data))
                    return prev;
                  return prev.map((r) => (r.id === data.id ? data : r));
                } else {
                  return [data, ...prev];
                }
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 🚪 Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 🎨 Status color mapping
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return map[status] || "bg-gray-100 text-gray-800";
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
            <p className="text-sm text-gray-600">Passenger: {user.name}</p>
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
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold" style={{ color: BRAND_GREEN }}>
            My Rides
          </h2>
          <Button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="bg-[color:var(--brand-green,#38761D)] hover:bg-green-800"
            style={{
              backgroundColor: BRAND_GREEN,
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {showRequestForm ? "Close Form" : "Request Ride"}
          </Button>
        </div>

        {/* Ride Request Form */}
        {showRequestForm && (
          <div className="mb-6 animate-fade-in">
            <RideRequestForm onClose={() => setShowRequestForm(false)} />
          </div>
        )}

        {/* Ride List */}
        <div className="grid gap-4">
          {rides.length === 0 ? (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500">
                  No rides yet. Request your first ride!
                </p>
              </CardContent>
            </Card>
          ) : (
            rides.map((ride) => (
              <Card
                key={ride.id}
                className={`transition hover:shadow-md ${
                  ride.status === "pending"
                    ? "border-yellow-200 bg-yellow-50/50"
                    : ride.status === "accepted"
                    ? "border-green-200 bg-green-50/50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold">
                        Ride Request
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(ride.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(ride.status)}>
                      {ride.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Locations */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin
                        className="mt-1 h-4 w-4"
                        style={{ color: BRAND_GREEN }}
                      />
                      <div>
                        <p className="text-sm font-medium">Pickup</p>
                        <p className="text-sm text-gray-600">
                          {ride.pickup_location?.address || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-1 h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Drop-off</p>
                        <p className="text-sm text-gray-600">
                          {ride.dropoff_location?.address || "Unknown"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Driver Details */}
                  {ride.status === "accepted" && ride.driver && (
                    <div className="rounded-lg border bg-white p-4">
                      <p
                        className="mb-2 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: BRAND_GREEN }}
                      >
                        Driver Details
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-green-700" />
                          <span>{ride.driver.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-green-700" />
                          <span>{ride.driver.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-green-700" />
                          <span>{ride.driver.vehicle_info}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { MapPin, Clock, User, Phone, Car, LogOut, Plus } from "lucide-react";
// import { useRouter } from "next/navigation";
// import RideRequestForm from "./ride-request-form";

// interface Ride {
//   id: string;
//   pickup_location: { address: string; lat: number; lng: number };
//   dropoff_location: { address: string; lat: number; lng: number };
//   status: string;
//   created_at: string;
//   driver?: {
//     name: string;
//     phone: string;
//     vehicle_info: string;
//   };
// }

// interface PassengerDashboardProps {
//   user: { name: string };
//   rides: Ride[];
// }

// export default function PassengerDashboard({
//   user,
//   rides: initialRides,
// }: PassengerDashboardProps) {
//   const [rides, setRides] = useState<Ride[]>(initialRides);
//   const [showRequestForm, setShowRequestForm] = useState(false);
//   const router = useRouter();
//   const supabase = createClient();

//   // 🔄 Realtime listener for ride updates
//   useEffect(() => {
//     const channel = supabase
//       .channel("passenger-rides")
//       .on(
//         "postgres_changes",
//         { event: "*", schema: "public", table: "rides" },
//         async (payload) => {
//           if (["INSERT", "UPDATE"].includes(payload.eventType)) {
//             const { data } = await supabase
//               .from("rides")
//               .select(
//                 `
//                 *,
//                 driver:driver_id (
//                   name,
//                   phone,
//                   vehicle_info
//                 )
//               `
//               )
//               .eq("id", (payload?.new as { id: string })?.id)
//               .single();

//             if (data) {
//               setRides((prev) => {
//                 const existing = prev.find((r) => r.id === data.id);
//                 if (existing) {
//                   if (JSON.stringify(existing) === JSON.stringify(data))
//                     return prev;
//                   return prev.map((r) => (r.id === data.id ? data : r));
//                 } else {
//                   return [data, ...prev];
//                 }
//               });
//             }
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [supabase]);

//   // 🚪 Logout
//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//     router.push("/");
//   };

//   // 🎨 Status color mapping
//   const getStatusColor = (status: string) => {
//     const map: Record<string, string> = {
//       pending: "bg-yellow-100 text-yellow-800",
//       accepted: "bg-green-100 text-green-800",
//       completed: "bg-blue-100 text-blue-800",
//       cancelled: "bg-red-100 text-red-800",
//     };
//     return map[status] || "bg-gray-100 text-gray-800";
//   };

//   return (
//     <div className="min-h-svh bg-gradient-to-br from-green-50 to-white">
//       {/* Header */}
//       <header className="border-b bg-white">
//         <div className="container mx-auto flex items-center justify-between p-4">
//           <div>
//             <h1 className="text-2xl font-bold text-green-700">KeKe Ride</h1>
//             <p className="text-sm text-muted-foreground">
//               Welcome, {user.name}
//             </p>
//           </div>
//           <Button variant="ghost" size="icon" onClick={handleLogout}>
//             <LogOut className="h-5 w-5" />
//           </Button>
//         </div>
//       </header>

//       {/* Main */}
//       <main className="container mx-auto p-4 md:p-6">
//         <div className="mb-6 flex items-center justify-between">
//           <h2 className="text-2xl font-semibold">My Rides</h2>
//           <Button
//             onClick={() => setShowRequestForm(!showRequestForm)}
//             className="bg-green-600 hover:bg-green-700"
//           >
//             <Plus className="mr-2 h-4 w-4" />
//             {showRequestForm ? "Close Form" : "Request Ride"}
//           </Button>
//         </div>

//         {/* Ride Request Form */}
//         {showRequestForm && (
//           <div className="mb-6 animate-fade-in">
//             <RideRequestForm onClose={() => setShowRequestForm(false)} />
//           </div>
//         )}

//         {/* Ride List */}
//         <div className="grid gap-4">
//           {rides.length === 0 ? (
//             <Card className="border-green-100 bg-green-50/50">
//               <CardContent className="flex flex-col items-center justify-center py-12">
//                 <Car className="mb-4 h-12 w-12 text-muted-foreground" />
//                 <p className="text-muted-foreground">
//                   No rides yet. Request your first ride!
//                 </p>
//               </CardContent>
//             </Card>
//           ) : (
//             rides.map((ride) => (
//               <Card key={ride.id} className="hover:shadow-md transition">
//                 <CardHeader>
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <CardTitle className="text-lg">Ride Request</CardTitle>
//                       <CardDescription className="flex items-center gap-1 text-xs">
//                         <Clock className="h-3 w-3" />
//                         {new Date(ride.created_at).toLocaleString()}
//                       </CardDescription>
//                     </div>
//                     <Badge className={getStatusColor(ride.status)}>
//                       {ride.status}
//                     </Badge>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="space-y-4">
//                   {/* Locations */}
//                   <div className="space-y-2">
//                     <div className="flex items-start gap-2">
//                       <MapPin className="mt-1 h-4 w-4 text-green-600" />
//                       <div>
//                         <p className="text-sm font-medium">Pickup</p>
//                         <p className="text-sm text-muted-foreground">
//                           {ride.pickup_location?.address || "Unknown"}
//                         </p>
//                       </div>
//                     </div>
//                     <div className="flex items-start gap-2">
//                       <MapPin className="mt-1 h-4 w-4 text-red-600" />
//                       <div>
//                         <p className="text-sm font-medium">Drop-off</p>
//                         <p className="text-sm text-muted-foreground">
//                           {ride.dropoff_location?.address || "Unknown"}
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Driver Details */}
//                   {ride.status === "accepted" && ride.driver && (
//                     <div className="rounded-lg border bg-green-50 p-4">
//                       <p className="mb-2 text-sm font-semibold text-green-900">
//                         Driver Details
//                       </p>
//                       <div className="space-y-1 text-sm">
//                         <div className="flex items-center gap-2">
//                           <User className="h-4 w-4 text-green-700" />
//                           <span>{ride.driver.name}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Phone className="h-4 w-4 text-green-700" />
//                           <span>{ride.driver.phone}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Car className="h-4 w-4 text-green-700" />
//                           <span>{ride.driver.vehicle_info}</span>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// // "use client"

// // import { useState, useEffect } from "react"
// // import { createClient } from "@/lib/supabase/client"
// // import { Button } from "@/components/ui/button"
// // import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// // import { Badge } from "@/components/ui/badge"
// // import { MapPin, Clock, User, Phone, Car, LogOut, Plus } from "lucide-react"
// // import { useRouter } from "next/navigation"
// // import RideRequestForm from "./ride-request-form"

// // interface Ride {
// //   id: string
// //   pickup_location: { address: string; lat: number; lng: number }
// //   dropoff_location: { address: string; lat: number; lng: number }
// //   status: string
// //   created_at: string
// //   driver?: {
// //     name: string
// //     phone: string
// //     vehicle_info: string
// //   }
// // }

// // interface PassengerDashboardProps {
// //   user: { name: string }
// //   rides: Ride[]
// // }

// // export default function PassengerDashboard({ user, rides: initialRides }: PassengerDashboardProps) {
// //   const [rides, setRides] = useState<Ride[]>(initialRides)
// //   const [showRequestForm, setShowRequestForm] = useState(false)
// //   const router = useRouter()
// //   const supabase = createClient()

// //   useEffect(() => {
// //     // Subscribe to ride updates
// //     const channel = supabase
// //       .channel("passenger-rides")
// //       .on(
// //         "postgres_changes",
// //         {
// //           event: "*",
// //           schema: "public",
// //           table: "rides",
// //         },
// //         async (payload) => {
// //           if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
// //             // Fetch updated ride with driver info
// //             const { data } = await supabase
// //               .from("rides")
// //               .select(`
// //                 *,
// //                 driver:driver_id (
// //                   name,
// //                   phone,
// //                   vehicle_info
// //                 )
// //               `)
// //               .eq("id", payload.new.id)
// //               .single()

// //             if (data) {
// //               setRides((prev) => {
// //                 const index = prev.findIndex((r) => r.id === data.id)
// //                 if (index >= 0) {
// //                   const updated = [...prev]
// //                   updated[index] = data
// //                   return updated
// //                 } else {
// //                   return [data, ...prev]
// //                 }
// //               })
// //             }
// //           }
// //         },
// //       )
// //       .subscribe()

// //     return () => {
// //       supabase.removeChannel(channel)
// //     }
// //   }, [supabase])

// //   const handleLogout = async () => {
// //     await supabase.auth.signOut()
// //     router.push("/")
// //   }

// //   const getStatusColor = (status: string) => {
// //     switch (status) {
// //       case "pending":
// //         return "bg-yellow-100 text-yellow-800"
// //       case "accepted":
// //         return "bg-green-100 text-green-800"
// //       case "completed":
// //         return "bg-blue-100 text-blue-800"
// //       case "cancelled":
// //         return "bg-red-100 text-red-800"
// //       default:
// //         return "bg-gray-100 text-gray-800"
// //     }
// //   }

// //   return (
// //     <div className="min-h-svh bg-gradient-to-br from-green-50 to-white">
// //       <header className="border-b bg-white">
// //         <div className="container mx-auto flex items-center justify-between p-4">
// //           <div>
// //             <h1 className="text-2xl font-bold text-green-700">KeKe Ride</h1>
// //             <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
// //           </div>
// //           <Button variant="ghost" size="icon" onClick={handleLogout}>
// //             <LogOut className="h-5 w-5" />
// //           </Button>
// //         </div>
// //       </header>

// //       <main className="container mx-auto p-4 md:p-6">
// //         <div className="mb-6 flex items-center justify-between">
// //           <h2 className="text-2xl font-semibold">My Rides</h2>
// //           <Button onClick={() => setShowRequestForm(true)} className="bg-green-600 hover:bg-green-700">
// //             <Plus className="mr-2 h-4 w-4" />
// //             Request Ride
// //           </Button>
// //         </div>

// //         {showRequestForm && (
// //           <div className="mb-6">
// //             <RideRequestForm onClose={() => setShowRequestForm(false)} />
// //           </div>
// //         )}

// //         <div className="grid gap-4">
// //           {rides.length === 0 ? (
// //             <Card>
// //               <CardContent className="flex flex-col items-center justify-center py-12">
// //                 <Car className="mb-4 h-12 w-12 text-muted-foreground" />
// //                 <p className="text-muted-foreground">No rides yet. Request your first ride!</p>
// //               </CardContent>
// //             </Card>
// //           ) : (
// //             rides.map((ride) => (
// //               <Card key={ride.id}>
// //                 <CardHeader>
// //                   <div className="flex items-start justify-between">
// //                     <div>
// //                       <CardTitle className="text-lg">Ride Request</CardTitle>
// //                       <CardDescription className="flex items-center gap-1 text-xs">
// //                         <Clock className="h-3 w-3" />
// //                         {new Date(ride.created_at).toLocaleString()}
// //                       </CardDescription>
// //                     </div>
// //                     <Badge className={getStatusColor(ride.status)}>{ride.status}</Badge>
// //                   </div>
// //                 </CardHeader>
// //                 <CardContent className="space-y-4">
// //                   <div className="space-y-2">
// //                     <div className="flex items-start gap-2">
// //                       <MapPin className="mt-1 h-4 w-4 text-green-600" />
// //                       <div>
// //                         <p className="text-sm font-medium">Pickup</p>
// //                         <p className="text-sm text-muted-foreground">{ride.pickup_location.address}</p>
// //                       </div>
// //                     </div>
// //                     <div className="flex items-start gap-2">
// //                       <MapPin className="mt-1 h-4 w-4 text-red-600" />
// //                       <div>
// //                         <p className="text-sm font-medium">Drop-off</p>
// //                         <p className="text-sm text-muted-foreground">{ride.dropoff_location.address}</p>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   {ride.status === "accepted" && ride.driver && (
// //                     <div className="rounded-lg border bg-green-50 p-4">
// //                       <p className="mb-2 text-sm font-semibold text-green-900">Driver Details</p>
// //                       <div className="space-y-1 text-sm">
// //                         <div className="flex items-center gap-2">
// //                           <User className="h-4 w-4 text-green-700" />
// //                           <span>{ride.driver.name}</span>
// //                         </div>
// //                         <div className="flex items-center gap-2">
// //                           <Phone className="h-4 w-4 text-green-700" />
// //                           <span>{ride.driver.phone}</span>
// //                         </div>
// //                         <div className="flex items-center gap-2">
// //                           <Car className="h-4 w-4 text-green-700" />
// //                           <span>{ride.driver.vehicle_info}</span>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   )}
// //                 </CardContent>
// //               </Card>
// //             ))
// //           )}
// //         </div>
// //       </main>
// //     </div>
// //   )
// // }
