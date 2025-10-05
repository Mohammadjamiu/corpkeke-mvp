"use client"

import { useState, useEffect, useRef, type FormEvent } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, MapPin, AlertCircle } from "lucide-react"

interface RideRequestFormProps {
  onClose: () => void
}

interface Location {
  address: string
  lat: number
  lng: number
}

interface MapboxFeature {
  place_name: string
  center: [number, number]
}

export default function RideRequestForm({ onClose }: RideRequestFormProps) {
  const [pickupAddress, setPickupAddress] = useState("")
  const [dropoffAddress, setDropoffAddress] = useState("")
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null)
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null)
  const [pickupSuggestions, setPickupSuggestions] = useState<MapboxFeature[]>([])
  const [dropoffSuggestions, setDropoffSuggestions] = useState<MapboxFeature[]>([])
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false)
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pickupRef = useRef<HTMLDivElement>(null)
  const dropoffRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""
  const hasMapboxToken = MAPBOX_TOKEN.length > 20

  // 🧭 Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node))
        setShowPickupSuggestions(false)
      if (dropoffRef.current && !dropoffRef.current.contains(event.target as Node))
        setShowDropoffSuggestions(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 🔍 Search location (Mapbox)
  const searchLocation = async (query: string, isPickup: boolean) => {
    if (query.length < 3 || !hasMapboxToken) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
          `access_token=${MAPBOX_TOKEN}&proximity=8.5167,11.9667&country=NG&limit=5`
      )

      if (!response.ok) throw new Error(`Mapbox API error: ${response.status}`)
      const data = await response.json()

      if (isPickup) {
        setPickupSuggestions(data.features || [])
        setShowPickupSuggestions(true)
      } else {
        setDropoffSuggestions(data.features || [])
        setShowDropoffSuggestions(true)
      }
    } catch (err) {
      console.error("[KeKe] Mapbox error:", err)
      setError("Failed to fetch locations. Please try again.")
    }
  }

  // 🏁 Input change handlers
  const handlePickupChange = (value: string) => {
    setPickupAddress(value)
    setPickupLocation(null)
    searchLocation(value, true)
  }

  const handleDropoffChange = (value: string) => {
    setDropoffAddress(value)
    setDropoffLocation(null)
    searchLocation(value, false)
  }

  // 📍 Select a suggestion
  const selectPickupLocation = (feature: MapboxFeature) => {
    setPickupAddress(feature.place_name)
    setPickupLocation({
      address: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
    })
    setShowPickupSuggestions(false)
  }

  const selectDropoffLocation = (feature: MapboxFeature) => {
    setDropoffAddress(feature.place_name)
    setDropoffLocation({
      address: feature.place_name,
      lng: feature.center[0],
      lat: feature.center[1],
    })
    setShowDropoffSuggestions(false)
  }

  // 🚗 Submit ride request
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      setError("Please enter both pickup and drop-off locations")
      return
    }

    if (hasMapboxToken && (!pickupLocation || !dropoffLocation)) {
      setError("Please select valid locations from the suggestions")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in")

      const pickupData = pickupLocation || { address: pickupAddress, lat: 0, lng: 0 }
      const dropoffData = dropoffLocation || { address: dropoffAddress, lat: 0, lng: 0 }

      const { error: insertError } = await supabase.from("rides").insert({
        passenger_id: user.id,
        pickup_location: pickupData,
        dropoff_location: dropoffData,
        status: "pending",
      })

      if (insertError) throw insertError

      setPickupAddress("")
      setDropoffAddress("")
      setPickupLocation(null)
      setDropoffLocation(null)
      onClose()
    } catch (err) {
      console.error("[KeKe] Ride request error:", err)
      setError(err instanceof Error ? err.message : "Failed to create ride request")
    } finally {
      setIsLoading(false)
    }
  }

  // 🌿 UI
  return (
    <Card className="border-green-200 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-green-700">Request a Ride</CardTitle>
            <CardDescription className="text-muted-foreground">
              {hasMapboxToken
                ? "Search and select pickup and drop-off locations"
                : "Enter pickup and drop-off addresses manually"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!hasMapboxToken && (
            <div className="flex gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">Mapbox not configured</p>
                <p className="text-xs">
                  Add your Mapbox token to enable autocomplete. Visit{" "}
                  <a
                    href="https://mapbox.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    mapbox.com
                  </a>{" "}
                  to get one.
                </p>
              </div>
            </div>
          )}

          {/* Pickup */}
          <div className="space-y-2" ref={pickupRef}>
            <Label htmlFor="pickup">Pickup Location</Label>
            <div className="relative">
              <Input
                id="pickup"
                placeholder={hasMapboxToken ? "Search pickup location in Kano" : "Enter pickup location"}
                value={pickupAddress}
                onChange={(e) => handlePickupChange(e.target.value)}
                onFocus={() => pickupSuggestions.length > 0 && setShowPickupSuggestions(true)}
                required
                className={pickupLocation ? "border-green-500" : ""}
              />
              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg animate-fade-in">
                  {pickupSuggestions.map((feature, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectPickupLocation(feature)}
                      className="flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-green-50 last:border-b-0"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{feature.place_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Drop-off */}
          <div className="space-y-2" ref={dropoffRef}>
            <Label htmlFor="dropoff">Drop-off Location</Label>
            <div className="relative">
              <Input
                id="dropoff"
                placeholder={hasMapboxToken ? "Search drop-off location in Kano" : "Enter drop-off location"}
                value={dropoffAddress}
                onChange={(e) => handleDropoffChange(e.target.value)}
                onFocus={() => dropoffSuggestions.length > 0 && setShowDropoffSuggestions(true)}
                required
                className={dropoffLocation ? "border-green-500" : ""}
              />
              {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg animate-fade-in">
                  {dropoffSuggestions.map((feature, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectDropoffLocation(feature)}
                      className="flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-green-50 last:border-b-0"
                    >
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      <span>{feature.place_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading || (hasMapboxToken && (!pickupLocation || !dropoffLocation))}
            >
              {isLoading ? "Requesting..." : "Request Ride"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// "use client";

// import type React from "react";

// import { useState, useEffect, useRef } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { X, MapPin, AlertCircle } from "lucide-react";

// interface RideRequestFormProps {
//   onClose: () => void;
// }

// interface Location {
//   address: string;
//   lat: number;
//   lng: number;
// }

// interface MapboxFeature {
//   place_name: string;
//   center: [number, number];
// }

// export default function RideRequestForm({ onClose }: RideRequestFormProps) {
//   const [pickupAddress, setPickupAddress] = useState("");
//   const [dropoffAddress, setDropoffAddress] = useState("");
//   const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
//   const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
//   const [pickupSuggestions, setPickupSuggestions] = useState<MapboxFeature[]>(
//     []
//   );
//   const [dropoffSuggestions, setDropoffSuggestions] = useState<MapboxFeature[]>(
//     []
//   );
//   const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
//   const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const supabase = createClient();
//   const pickupRef = useRef<HTMLDivElement>(null);
//   const dropoffRef = useRef<HTMLDivElement>(null);

//   const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
//   const hasMapboxToken = MAPBOX_TOKEN && MAPBOX_TOKEN.length > 20;

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         pickupRef.current &&
//         !pickupRef.current.contains(event.target as Node)
//       ) {
//         setShowPickupSuggestions(false);
//       }
//       if (
//         dropoffRef.current &&
//         !dropoffRef.current.contains(event.target as Node)
//       ) {
//         setShowDropoffSuggestions(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const searchLocation = async (query: string, isPickup: boolean) => {
//     if (query.length < 3) {
//       if (isPickup) {
//         setPickupSuggestions([]);
//       } else {
//         setDropoffSuggestions([]);
//       }
//       return;
//     }

//     if (!hasMapboxToken) {
//       return;
//     }

//     try {
//       const response = await fetch(
//         `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
//           query
//         )}.json?` +
//           `access_token=${MAPBOX_TOKEN}&` +
//           `proximity=8.5167,11.9667&` + // Kano coordinates
//           `country=NG&` + // Nigeria
//           `limit=5`
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("[v0] Mapbox API error:", response.status, errorText);
//         throw new Error(`Mapbox API error: ${response.status}`);
//       }

//       const data = await response.json();

//       if (isPickup) {
//         setPickupSuggestions(data.features || []);
//         setShowPickupSuggestions(true);
//       } else {
//         setDropoffSuggestions(data.features || []);
//         setShowDropoffSuggestions(true);
//       }
//     } catch (err) {
//       console.error("[v0] Geocoding error:", err);
//       setError(
//         err instanceof Error ? err.message : "Failed to search locations"
//       );
//     }
//   };

//   const handlePickupChange = (value: string) => {
//     setPickupAddress(value);
//     setPickupLocation(null);
//     searchLocation(value, true);
//   };

//   const handleDropoffChange = (value: string) => {
//     setDropoffAddress(value);
//     setDropoffLocation(null);
//     searchLocation(value, false);
//   };

//   const selectPickupLocation = (feature: MapboxFeature) => {
//     setPickupAddress(feature.place_name);
//     setPickupLocation({
//       address: feature.place_name,
//       lng: feature.center[0],
//       lat: feature.center[1],
//     });
//     setShowPickupSuggestions(false);
//   };

//   const selectDropoffLocation = (feature: MapboxFeature) => {
//     setDropoffAddress(feature.place_name);
//     setDropoffLocation({
//       address: feature.place_name,
//       lng: feature.center[0],
//       lat: feature.center[1],
//     });
//     setShowDropoffSuggestions(false);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!hasMapboxToken) {
//       if (!pickupAddress.trim() || !dropoffAddress.trim()) {
//         setError("Please enter both pickup and drop-off locations");
//         return;
//       }
//     } else if (!pickupLocation || !dropoffLocation) {
//       setError("Please select locations from the suggestions");
//       return;
//     }

//     setIsLoading(true);
//     setError(null);

//     try {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser();
//       if (!user) throw new Error("Not authenticated");

//       const pickupData =
//         hasMapboxToken && pickupLocation
//           ? pickupLocation
//           : { address: pickupAddress, lat: 0, lng: 0 };
//       const dropoffData =
//         hasMapboxToken && dropoffLocation
//           ? dropoffLocation
//           : { address: dropoffAddress, lat: 0, lng: 0 };

//       const { error: insertError } = await supabase.from("rides").insert({
//         passenger_id: user.id,
//         pickup_location: pickupData,
//         dropoff_location: dropoffData,
//         status: "pending",
//       });

//       if (insertError) throw insertError;

//       setPickupAddress("");
//       setDropoffAddress("");
//       setPickupLocation(null);
//       setDropoffLocation(null);
//       onClose();
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Failed to create ride request"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle>Request a Ride</CardTitle>
//             <CardDescription>
//               {hasMapboxToken
//                 ? "Search and select your pickup and drop-off locations"
//                 : "Enter your pickup and drop-off locations"}
//             </CardDescription>
//           </div>
//           <Button variant="ghost" size="icon" onClick={onClose}>
//             <X className="h-4 w-4" />
//           </Button>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {!hasMapboxToken && (
//             <div className="flex gap-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
//               <AlertCircle className="h-4 w-4 flex-shrink-0" />
//               <div>
//                 <p className="font-medium">Location search disabled</p>
//                 <p className="text-xs">
//                   Add your Mapbox token to enable autocomplete. Get one free at{" "}
//                   <a
//                     href="https://mapbox.com"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="underline"
//                   >
//                     mapbox.com
//                   </a>
//                 </p>
//               </div>
//             </div>
//           )}

//           <div className="space-y-2" ref={pickupRef}>
//             <Label htmlFor="pickup">Pickup Location</Label>
//             <div className="relative">
//               <Input
//                 id="pickup"
//                 placeholder={
//                   hasMapboxToken
//                     ? "Search for pickup location in Kano"
//                     : "Enter pickup location"
//                 }
//                 value={pickupAddress}
//                 onChange={(e) => handlePickupChange(e.target.value)}
//                 onFocus={() =>
//                   pickupSuggestions.length > 0 && setShowPickupSuggestions(true)
//                 }
//                 required
//                 className={pickupLocation ? "border-green-500" : ""}
//               />
//               {showPickupSuggestions && pickupSuggestions.length > 0 && (
//                 <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
//                   {pickupSuggestions.map((feature, index) => (
//                     <button
//                       key={index}
//                       type="button"
//                       onClick={() => selectPickupLocation(feature)}
//                       className="flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-green-50 last:border-b-0"
//                     >
//                       <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
//                       <span className="text-pretty">{feature.place_name}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="space-y-2" ref={dropoffRef}>
//             <Label htmlFor="dropoff">Drop-off Location</Label>
//             <div className="relative">
//               <Input
//                 id="dropoff"
//                 placeholder={
//                   hasMapboxToken
//                     ? "Search for drop-off location in Kano"
//                     : "Enter drop-off location"
//                 }
//                 value={dropoffAddress}
//                 onChange={(e) => handleDropoffChange(e.target.value)}
//                 onFocus={() =>
//                   dropoffSuggestions.length > 0 &&
//                   setShowDropoffSuggestions(true)
//                 }
//                 required
//                 className={dropoffLocation ? "border-green-500" : ""}
//               />
//               {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
//                 <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
//                   {dropoffSuggestions.map((feature, index) => (
//                     <button
//                       key={index}
//                       type="button"
//                       onClick={() => selectDropoffLocation(feature)}
//                       className="flex w-full items-start gap-2 border-b p-3 text-left text-sm hover:bg-green-50 last:border-b-0"
//                     >
//                       <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
//                       <span className="text-pretty">{feature.place_name}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {error && (
//             <div className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
//               <AlertCircle className="h-4 w-4 flex-shrink-0" />
//               <p>{error}</p>
//             </div>
//           )}

//           <div className="flex gap-2">
//             <Button
//               type="submit"
//               className="flex-1 bg-green-600 hover:bg-green-700"
//               disabled={
//                 isLoading ||
//                 (hasMapboxToken && (!pickupLocation || !dropoffLocation))
//               }
//             >
//               {isLoading ? "Requesting..." : "Request Ride"}
//             </Button>
//             <Button type="button" variant="outline" onClick={onClose}>
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }
